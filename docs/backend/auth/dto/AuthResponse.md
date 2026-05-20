# AuthResponse

## Назначение

DTO (Data Transfer Object) — объект передачи данных, который возвращается клиенту при успешном входе или обновлении токена. Содержит access-токен, refresh-токен и базовую информацию о пользователе. Используется Java Record — неизменяемый класс с минимальным кодом.

## Полный разбор кода

```java
public record AuthResponse(
    String accessToken,
    String refreshToken,
    UserDto user
) {
    public record UserDto(
        Long id,
        String nickname,
        String email,
        UserRole role
    ) {}
}
```

### Построчный разбор

**`public record AuthResponse(...)`**
`record` — специальный тип класса, появившийся в Java 16. Автоматически генерирует:
- Конструктор со всеми параметрами
- Геттеры для каждого поля (без префикса `get`: `accessToken()`, не `getAccessToken()`)
- `equals()`, `hashCode()`, `toString()`

Record неизменяем (immutable): после создания объекта изменить поля нельзя. Это безопаснее и лучше читается для DTO.

**`String accessToken`**
JWT access-токен — короткоживущий (15 минут). Фронтенд сохраняет его в `localStorage` и отправляет в заголовке `Authorization: Bearer <token>`.

**`String refreshToken`**
Долгоживущий refresh-токен (14 дней). Хотя он есть в теле ответа, фронтенд не использует его напрямую — он сохраняется в httpOnly cookie сервером через `setRefreshTokenCookie()` в `AuthController`.

**`UserDto user`**
Вложенный record `UserDto` — минимальные данные о пользователе, нужные фронтенду сразу после входа (ID, никнейм, email, роль). Не нужно делать отдельный запрос к `/api/users/me`.

**`public record UserDto(...)`**
Вложенный record — это внутренний класс, доступный как `AuthResponse.UserDto`. По умолчанию вложенные классы в record являются статическими (можно создать без создания экземпляра родительского record).

**Как используется:**
```java
// В AuthService:
return new AuthResponse(
    accessToken,
    refreshTokenValue,
    new AuthResponse.UserDto(user.getUserId(), user.getNickname(), user.getEmail(), user.getRole())
);
```
