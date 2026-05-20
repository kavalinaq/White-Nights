# UserProfileResponse

## Назначение

DTO ответа с данными профиля пользователя. Используется как для своего профиля (`/me`), так и для чужих. Комбинация `record` и `@Builder` позволяет удобно создавать объект с нужным набором полей.

## Полный разбор кода

```java
@Builder
public record UserProfileResponse(
    Long userId,
    String nickname,
    String email,       // Only for self
    String bio,
    String avatarUrl,
    UserRole role,
    boolean isPrivate,
    String followStatus, // none, pending, accepted
    boolean isBlocked,
    long followingCount,
    long followerCount,
    long postCount,
    LocalDateTime createdAt
) {}
```

### Построчный разбор

**`@Builder` на `record`**
Обычно Lombok `@Builder` и Java `record` дублируют функциональность (оба генерируют конструктор). Но `@Builder` на `record` создаёт Builder-паттерн, позволяя создавать объект с явным указанием только нужных полей — и без необходимости задавать все в строго определённом порядке.

**`String email`** — комментарий `// Only for self`
В `ProfileService` email устанавливается только когда `isSelf = true`:
```java
.email(isSelf ? user.getEmail() : null)
```

**`String followStatus`**
Не enum, а строка (`"none"`, `"pending"`, `"accepted"`). Это упрощает сериализацию в JSON — фронтенд получает строку напрямую.

**`boolean isBlocked`**
`true` если текущий пользователь заблокировал владельца профиля. Не наоборот — нельзя знать, заблокировал ли тебя кто-то другой.

**Приватный профиль:**
Если аккаунт приватный и текущий пользователь не является подписчиком — `ProfileService` возвращает ответ только с базовыми полями (userId, nickname, avatarUrl, followStatus, isPrivate). Остальные поля `null`.
