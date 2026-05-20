# UserSummaryResponse / UpdateProfileRequest / FollowRequestResponse

## UserSummaryResponse

Минимальный DTO пользователя для списков: подписчики, подписки, результаты поиска.

```java
public record UserSummaryResponse(
    Long userId,
    String nickname,
    String avatarUrl
) {}
```
Только три поля — ID, никнейм, аватар. Используется там, где не нужен полный профиль.

---

## UpdateProfileRequest

DTO для частичного обновления профиля. Все поля необязательные — обновляются только те, что переданы.

```java
public record UpdateProfileRequest(
    @Size(min = 3, max = 50) String nickname,
    @Size(max = 500) String bio,
    Boolean isPrivate
) {}
```

**`@Size(min = 3, max = 50) String nickname`** — ограничения те же, что при регистрации. `@Size` не отклоняет `null` — только проверяет длину если значение есть.

**`Boolean isPrivate`** (с большой буквы) — объектный тип, может быть `null`. `boolean` (примитив) не может быть `null` — тогда нельзя было бы отличить «не передано» от `false`.

**Логика в `ProfileService`:**
```java
if (request.nickname() != null) user.setNickname(request.nickname());
if (request.bio() != null) user.setBio(request.bio());
if (request.isPrivate() != null) user.setPrivate(request.isPrivate());
```
Каждое поле обновляется только если передано.

---

## FollowRequestResponse

DTO заявки на подписку к приватному аккаунту.

```java
public record FollowRequestResponse(
    Long followerId,
    String nickname,
    String avatarUrl,
    LocalDateTime createdAt
) {}
```

`createdAt` — время подачи заявки. Позволяет показать пользователю, как давно кто-то хочет на него подписаться.
