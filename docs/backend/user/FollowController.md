# FollowController

## Назначение

REST-контроллер для управления подписками. Обрабатывает запросы подписки/отписки, получения списков подписчиков/подписок, а также управление заявками на подписку к приватным аккаунтам.

## Полный разбор кода

```java
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class FollowController {

    @GetMapping("/{id}/followers")
    public List<UserSummaryResponse> getFollowers(
            @PathVariable Long id,
            @RequestParam(defaultValue = "50") int limit) {
        return followRepository.findByFolloweeAndStatus(target, FollowStatus.accepted, PageRequest.of(0, Math.min(limit, 100)))
            .stream()
            .map(f -> new UserSummaryResponse(
                f.getFollower().getUserId(),
                f.getFollower().getNickname(),
                f.getFollower().getAvatarUrl()
            ))
            .toList();
    }

    @PostMapping("/{id}/follow")
    public void follow(@PathVariable Long id, @AuthenticationPrincipal String email) {
        followService.follow(id, currentUserResolver.resolve(email));
    }

    @GetMapping("/me/follow-requests")
    public List<FollowRequestResponse> getFollowRequests(@AuthenticationPrincipal String email) {
        return followRepository.findByFolloweeAndStatus(currentUser, FollowStatus.pending, PageRequest.of(0, 100))
            .stream()
            .map(f -> new FollowRequestResponse(
                f.getFollower().getUserId(),
                f.getFollower().getNickname(),
                f.getFollower().getAvatarUrl(),
                f.getCreatedAt()
            ))
            .toList();
    }

    @PostMapping("/me/follow-requests/{followerId}/accept")
    public void acceptRequest(@PathVariable Long followerId, @AuthenticationPrincipal String email) {
        followService.acceptRequest(followerId, currentUserResolver.resolve(email));
    }
}
```

### Построчный разбор

**`@RequestParam(defaultValue = "50") int limit`**
Необязательный параметр запроса: `/api/users/1/followers?limit=20`. Если параметр не указан — используется значение по умолчанию `50`.

**`Math.min(limit, 100)`**
Клиент не может запросить более 100 подписчиков за раз — защита от чрезмерной нагрузки на БД.

**`PageRequest.of(0, Math.min(limit, 100))`**
Создаёт объект пагинации для Spring Data. Первый аргумент: номер страницы (0-based). Второй: количество записей. Результат передаётся в метод репозитория.

**`.stream().map(...).toList()`**
Цепочка Stream API:
1. `.stream()` — создаёт поток из списка `Follow` объектов
2. `.map(f -> new UserSummaryResponse(...))` — преобразует каждый `Follow` в `UserSummaryResponse` (только нужные поля, без лишних данных)
3. `.toList()` — собирает результат в неизменяемый список

**`FollowStatus.pending`**
Заявки на подписку (только для приватных аккаунтов). Когда подписываются на приватный аккаунт — создаётся запись со статусом `pending`. Владелец видит их в `/me/follow-requests` и может принять/отклонить.
