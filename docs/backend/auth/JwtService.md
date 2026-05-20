# JwtService

## Назначение

Сервис для работы с JWT (JSON Web Token) токенами. Генерирует access-токены при входе пользователя и проверяет их при каждом запросе к защищённым endpoint-ам. JWT позволяет сделать API «без состояния» (stateless): сервер не хранит сессии, вся информация о пользователе закодирована в самом токене.

## Что такое JWT

JWT — это строка из трёх частей, разделённых точкой:
- **Header** (алгоритм + тип): `eyJhbGciOiJIUzI1NiJ9`
- **Payload** (данные): `eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIifQ`
- **Signature** (подпись): `SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`

Подпись создаётся с помощью секретного ключа — только сервер может её создать и проверить.

## Полный разбор кода

```java
@Service
public class JwtService {

    @Value("${auth.jwt.secret}")
    private String secret;

    @Value("${auth.jwt.access-expiration-ms}")
    private long accessExpiration;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(User user) {
        return generateToken(Map.of("role", user.getRole().name()), user.getEmail(), accessExpiration);
    }

    private String generateToken(Map<String, Object> extraClaims, String subject, long expiration) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    public boolean isTokenValid(String token, String userEmail) {
        final String email = extractEmail(token);
        return (email.equals(userEmail)) && !isTokenExpired(token);
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
}
```

### Построчный разбор

**`Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8))`**
Преобразует строку секрета из `application.yml` в криптографический ключ `SecretKey`. `HMAC-SHA` — алгоритм создания цифровой подписи. `StandardCharsets.UTF_8` — явно указывает кодировку, чтобы не зависеть от настроек системы.

**`Map.of("role", user.getRole().name())`**
Создаёт неизменяемую карту с одной записью. `user.getRole().name()` — получает имя enum-значения как строку: `UserRole.user` → `"user"`.

**`generateToken(Map<String, Object> extraClaims, String subject, long expiration)`**
Приватный метод, который делает реальную работу. `extraClaims` — дополнительные данные в токене (роль пользователя). `subject` — идентификатор, для кого выдан токен (email). `expiration` — время жизни в миллисекундах.

**`Jwts.builder()`**
Паттерн Builder для пошагового создания JWT. Каждый вызов метода возвращает тот же builder, что позволяет цепочкой задавать параметры.

**`.claims(extraClaims)`**
Добавляет кастомные claims (утверждения) в payload токена. Claim — это пара ключ-значение в JSON-части токена.

**`.subject(subject)`**
Стандартный claim `sub` — кому принадлежит токен. Здесь хранится email пользователя.

**`.issuedAt(new Date(System.currentTimeMillis()))`**
Стандартный claim `iat` (issued at) — когда токен был выдан. `System.currentTimeMillis()` возвращает текущее время в миллисекундах с 1970 года (Unix timestamp).

**`.expiration(new Date(System.currentTimeMillis() + expiration))`**
Стандартный claim `exp` — когда токен истекает. Библиотека JJWT автоматически проверяет этот claim при парсинге.

**`.signWith(getSigningKey())`**
Подписывает токен секретным ключом. Без правильной подписи токен будет отклонён при проверке.

**`.compact()`**
Финализирует и сериализует JWT в строку формата `header.payload.signature`.

**`private <T> T extractClaim(String token, Function<Claims, T> claimsResolver)`**
Обобщённый (generic) метод для извлечения любого claim из токена. `<T>` — параметр типа, конкретный тип определяется в момент вызова. `Function<Claims, T>` — функциональный интерфейс: принимает `Claims` и возвращает что-то типа `T`.

**`Claims::getSubject`**
Ссылка на метод (method reference) — краткая запись лямбды `claims -> claims.getSubject()`. Используется как `claimsResolver` для извлечения email.

**`claims -> claims.get("role", String.class)`**
Лямбда-выражение. `claims.get("role", String.class)` читает claim с ключом `"role"` и приводит его к типу `String`.

**`Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload()`**
Цепочка методов для парсинга токена:
1. `parser()` — создаёт парсер
2. `verifyWith(getSigningKey())` — устанавливает ключ для проверки подписи
3. `build()` — создаёт готовый парсер
4. `parseSignedClaims(token)` — парсит токен, проверяет подпись и срок (выбрасывает исключение при неверном токене)
5. `getPayload()` — возвращает раскодированный JSON-payload как объект `Claims`

**`extractExpiration(token).before(new Date())`**
`before(new Date())` — проверяет, что дата истечения токена раньше текущего момента. Если да — токен просрочен.
