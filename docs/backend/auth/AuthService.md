# AuthService

## Назначение

Сервис бизнес-логики аутентификации. Содержит всю логику регистрации, входа, подтверждения email, сброса пароля и обновления токенов. Это «мозг» авторизационного модуля — контроллер только делегирует работу этому классу.

## Полный разбор кода

```java
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository tokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final BookshelfService bookshelfService;

    @Value("${auth.jwt.refresh-expiration-ms}")
    private long refreshExpiration;

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email already exists");
        }
        if (userRepository.existsByNickname(request.nickname())) {
            throw new ConflictException("Nickname already exists");
        }

        User user = User.builder()
                .nickname(request.nickname())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .isVerified(false)
                .build();

        userRepository.save(user);
        bookshelfService.bootstrapShelves(user);

        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = VerificationToken.builder()
                .user(user)
                .token(token)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
        tokenRepository.save(verificationToken);

        emailService.sendVerificationEmail(user.getEmail(), token);
    }

    @Transactional
    public void verify(String token) {
        VerificationToken verificationToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new NotFoundException("Invalid token"));

        if (verificationToken.isExpired()) {
            throw new UnauthorizedException("Token expired");
        }

        User user = verificationToken.getUser();
        user.setVerified(true);
        userRepository.save(user);
        tokenRepository.delete(verificationToken);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (!user.isVerified()) {
            throw new UnauthorizedException("Account not verified");
        }

        if (user.isBlocked()) {
            throw new UnauthorizedException("Account is banned");
        }

        String accessToken = jwtService.generateAccessToken(user);
        String refreshTokenValue = UUID.randomUUID().toString();

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(LocalDateTime.now().plusNanos(refreshExpiration * 1_000_000))
                .build();
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(
                accessToken,
                refreshTokenValue,
                new AuthResponse.UserDto(
                        user.getUserId(),
                        user.getNickname(),
                        user.getEmail(),
                        user.getRole()
                )
        );
    }

    @Transactional
    public AuthResponse refresh(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new UnauthorizedException("Refresh token expired");
        }

        User user = refreshToken.getUser();
        String accessToken = jwtService.generateAccessToken(user);

        return new AuthResponse(
                accessToken,
                refreshToken.getToken(),
                new AuthResponse.UserDto(
                        user.getUserId(),
                        user.getNickname(),
                        user.getEmail(),
                        user.getRole()
                )
        );
    }

    @Transactional
    public void logout(String token) {
        refreshTokenRepository.deleteByToken(token);
    }

    @Transactional
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));

        passwordResetTokenRepository.deleteByUser_UserId(user.getUserId());

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .token(token)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
        passwordResetTokenRepository.save(resetToken);

        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    @Transactional
    public void resetPassword(ResetPassword request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.token())
                .orElseThrow(() -> new NotFoundException("Invalid token"));

        if (resetToken.isExpired()) {
            passwordResetTokenRepository.delete(resetToken);
            throw new UnauthorizedException("Token expired");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        passwordResetTokenRepository.delete(resetToken);
        refreshTokenRepository.deleteByUser(user);
    }
}
```

### Построчный разбор

**`@Service`**
Помечает класс как сервис — компонент бизнес-логики. Spring создаёт один экземпляр этого класса (синглтон) и управляет им.

**`@Value("${auth.jwt.refresh-expiration-ms}")`**
Внедряет значение из `application.yml` напрямую в поле. Синтаксис `${...}` читает свойство по имени.

**`@Transactional`**
Оборачивает метод в транзакцию БД. Если в процессе выполнения произойдёт исключение — все изменения в БД откатятся автоматически. Это гарантирует целостность данных (например, если пользователь создался, но полки не создались — откатится и то, и другое).

**`passwordEncoder.encode(request.password())`**
Никогда нельзя хранить пароли в открытом виде. `PasswordEncoder` (реализация BCrypt) вычисляет хэш пароля с солью. Хэш нельзя «расшифровать» — только проверить, совпадает ли введённый пароль с хэшем.

**`userRepository.save(user)`**
JPA-метод, который либо сохраняет новую запись (INSERT), либо обновляет существующую (UPDATE). Spring Data определяет это по наличию ID.

**`bookshelfService.bootstrapShelves(user)`**
Сразу при регистрации создаёт 3 стандартные полки для нового пользователя («Хочу прочитать», «Читаю», «Прочитал»). Это деловое требование — каждый пользователь должен иметь эти полки.

**`UUID.randomUUID().toString()`**
Генерирует случайный UUID (Universally Unique Identifier) — строку вида `550e8400-e29b-41d4-a716-446655440000`. Используется как токен подтверждения. Предугадать или перебрать его практически невозможно.

**`LocalDateTime.now().plusHours(24)`**
Текущее время плюс 24 часа — срок жизни токена подтверждения email.

**`tokenRepository.findByToken(token).orElseThrow(...)`**
`findByToken` возвращает `Optional<VerificationToken>` — контейнер, который может содержать значение или быть пустым. `orElseThrow` выбрасывает исключение, если токен не найден. Это безопаснее, чем проверять `null`.

**`passwordEncoder.matches(request.password(), user.getPasswordHash())`**
Проверяет, соответствует ли введённый пароль сохранённому хэшу. Нельзя сравнивать хэши напрямую — BCrypt включает соль, поэтому один и тот же пароль даёт разные хэши.

**`LocalDateTime.now().plusNanos(refreshExpiration * 1_000_000)`**
`refreshExpiration` задан в миллисекундах, а `plusNanos` принимает наносекунды. Умножение на 1_000_000 (миллион) конвертирует мс → нс. Символ `_` в числах — разделитель для читаемости, Java его игнорирует.

**`refreshTokenRepository.deleteByUser(user)`**
При смене пароля все существующие сессии (refresh-токены) аннулируются. Это стандартная практика безопасности: если пароль скомпрометирован и пользователь его сменил, злоумышленник с украденным токеном не сможет продолжать сессию.

**`passwordResetTokenRepository.deleteByUser_UserId(user.getUserId())`**
Spring Data автоматически генерирует SQL по имени метода. `deleteByUser_UserId` → `DELETE FROM password_reset_tokens WHERE user_id = ?`. Удаляем старый токен сброса пароля перед созданием нового.
