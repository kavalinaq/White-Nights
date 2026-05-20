# AuthController

## Назначение

REST-контроллер для аутентификации и авторизации. Обрабатывает HTTP-запросы на `/api/auth/*`: регистрацию, вход, подтверждение email, сброс пароля, обновление токенов и выход. Управляет httpOnly cookie с refresh-токеном.

## Полный разбор кода

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RateLimitingService rateLimitingService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void register(@RequestBody @Valid RegisterRequest request) {
        authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody @Valid LoginRequest request,
                              HttpServletRequest servletRequest,
                              HttpServletResponse response) {
        checkRateLimit(servletRequest, "login:" + request.email());
        AuthResponse authResponse = authService.login(request);
        setRefreshTokenCookie(response, authResponse.refreshToken());
        return authResponse;
    }

    @PostMapping("/verify")
    public void verify(@RequestParam String token) {
        authService.verify(token);
    }

    @PostMapping("/password/reset-request")
    public void requestPasswordReset(
            @RequestBody @Valid PasswordResetRequest request,
            HttpServletRequest servletRequest) {
        checkRateLimit(servletRequest, "reset-request:" + request.email());
        authService.requestPasswordReset(request.email());
    }

    @PostMapping("/password/reset")
    public void resetPassword(
            @RequestBody @Valid ResetPassword request,
            HttpServletRequest servletRequest) {
        checkRateLimit(servletRequest, "reset:" + servletRequest.getRemoteAddr());
        authService.resetPassword(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(
            @CookieValue(name = "refresh_token") String token,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.refresh(token);
        setRefreshTokenCookie(response, authResponse.refreshToken());
        return authResponse;
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(
            @CookieValue(name = "refresh_token", required = false) String token,
            HttpServletResponse response) {
        if (token != null) {
            authService.logout(token);
        }
        clearRefreshTokenCookie(response);
    }

    private void checkRateLimit(HttpServletRequest request, String key) {
        String ipKey = "ip:" + request.getRemoteAddr();
        if (!rateLimitingService.resolveBucket(ipKey).tryConsume(1)) {
            throw new TooManyRequestsException("Too many requests from this IP");
        }
        if (!rateLimitingService.resolveBucket(key).tryConsume(1)) {
            throw new TooManyRequestsException("Too many requests for this account/action");
        }
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("refresh_token", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // true в продакшене
        cookie.setPath("/api/auth");
        cookie.setMaxAge(14 * 24 * 60 * 60); // 14 дней
        response.addCookie(cookie);
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("refresh_token", null);
        cookie.setHttpOnly(true);
        cookie.setPath("/api/auth");
        cookie.setMaxAge(0); // Немедленное удаление
        response.addCookie(cookie);
    }
}
```

### Построчный разбор

**`@RestController`**
Комбинация `@Controller` + `@ResponseBody`. Означает, что каждый метод автоматически сериализует возвращаемое значение в JSON и пишет его в тело HTTP-ответа.

**`@RequestMapping("/api/auth")`**
Базовый URL для всех методов контроллера. Метод с `@PostMapping("/login")` будет доступен по пути `/api/auth/login`.

**`@RequiredArgsConstructor`**
Аннотация Lombok. Генерирует конструктор со всеми полями `final`. Spring использует этот конструктор для внедрения зависимостей (Dependency Injection).

**`private final AuthService authService`**
`final` означает, что поле устанавливается один раз в конструкторе и не меняется. Spring автоматически передаёт нужный экземпляр сервиса.

**`@ResponseStatus(HttpStatus.CREATED)`**
По умолчанию Spring возвращает HTTP 200. Эта аннотация меняет код на 201 (Created) — стандарт для успешного создания ресурса.

**`@RequestBody @Valid RegisterRequest request`**
- `@RequestBody` — Spring парсит JSON из тела запроса и создаёт объект `RegisterRequest`
- `@Valid` — запускает Bean Validation: проверяет аннотации `@NotBlank`, `@Email` и т.д. на полях DTO. Если валидация не прошла — возвращает HTTP 400

**`HttpServletRequest servletRequest`**
Объект с информацией о входящем запросе: IP-адрес, заголовки, параметры. Spring автоматически передаёт его в метод.

**`@RequestParam String token`**
Читает параметр из URL: `POST /api/auth/verify?token=abc123`.

**`@CookieValue(name = "refresh_token") String token`**
Читает значение cookie с именем `refresh_token` из HTTP-запроса. Spring автоматически извлекает его.

**`@CookieValue(name = "refresh_token", required = false)`**
`required = false` — не выбрасывать ошибку, если cookie нет (при logout пользователь мог уже его удалить).

**`cookie.setHttpOnly(true)`**
Запрещает JavaScript в браузере читать этот cookie через `document.cookie`. Защита от XSS атак: даже если злоумышленник внедрит скрипт, он не сможет украсть refresh-токен.

**`cookie.setSecure(false)`**
В продакшене должно быть `true` — тогда cookie передаётся только по HTTPS. `false` нужно для локальной разработки без HTTPS.

**`cookie.setPath("/api/auth")`**
Cookie отправляется браузером только при запросах к `/api/auth/*`. Нет смысла посылать refresh-токен с каждым запросом к другим endpoint-ам.

**`cookie.setMaxAge(14 * 24 * 60 * 60)`**
Срок жизни cookie в секундах: 14 дней * 24 часа * 60 минут * 60 секунд.

**`cookie.setMaxAge(0)`**
Мгновенно удаляет cookie в браузере пользователя.

**`rateLimitingService.resolveBucket(ipKey).tryConsume(1)`**
Пытается «потратить» 1 токен из корзины (bucket) для данного IP. Если токены закончились — возвращает `false` и мы бросаем исключение 429 Too Many Requests. Ограничение идёт по двум ключам: по IP (защита от одного IP) и по email (защита конкретного аккаунта).
