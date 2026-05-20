# FollowService

## Назначение

Сервис управления подписками. Реализует бизнес-логику подписки, отписки и обработки заявок. Учитывает приватность аккаунта: при подписке на приватный аккаунт создаётся заявка (`pending`), на публичный — сразу `accepted`.

## Полный разбор кода

```java
@Service
@RequiredArgsConstructor
public class FollowService {

    @Transactional
    public void follow(Long targetUserId, User currentUser) {
        if (currentUser.getUserId().equals(targetUserId)) {
            throw new BadRequestException("You cannot follow yourself");
        }

        User targetUser = userRepository.findById(targetUserId)
            .orElseThrow(() -> new NotFoundException("User not found"));

        if (followRepository.existsById(new Follow.FollowId(currentUser.getUserId(), targetUserId))) {
            return; // Already following or pending — идемпотентность
        }

        FollowStatus status = targetUser.isPrivate() ? FollowStatus.pending : FollowStatus.accepted;

        Follow follow = Follow.builder()
            .id(new Follow.FollowId(currentUser.getUserId(), targetUserId))
            .follower(currentUser)
            .followee(targetUser)
            .status(status)
            .build();

        followRepository.save(follow);
    }

    @Transactional
    public void unfollow(Long targetUserId, User currentUser) {
        followRepository.deleteById(new Follow.FollowId(currentUser.getUserId(), targetUserId));
    }

    @Transactional
    public void acceptRequest(Long followerId, User currentUser) {
        Follow follow = followRepository.findById(new Follow.FollowId(followerId, currentUser.getUserId()))
            .orElseThrow(() -> new NotFoundException("Follow request not found"));

        if (follow.getStatus() != FollowStatus.pending) {
            return; // Уже принята
        }

        follow.setStatus(FollowStatus.accepted);
        followRepository.save(follow);
    }

    @Transactional
    public void rejectRequest(Long followerId, User currentUser) {
        followRepository.deleteById(new Follow.FollowId(followerId, currentUser.getUserId()));
    }
}
```

### Построчный разбор

**`followRepository.existsById(new Follow.FollowId(...))`**
Проверяет наличие записи по составному ключу (follower_id, followee_id). Если запись есть — ничего не делаем. Это идемпотентность: повторная подписка не создаёт дублей.

**`targetUser.isPrivate() ? FollowStatus.pending : FollowStatus.accepted`**
Тернарный оператор. Если аккаунт приватный — создаётся заявка (`pending`), которую владелец должен принять. Если публичный — сразу подписка (`accepted`).

**`new Follow.FollowId(currentUser.getUserId(), targetUserId)`**
Составной первичный ключ. `FollowId` — статический вложенный класс с полями `followerId` и `followeeId`. Вместе они однозначно идентифицируют подписку.

**`follow.setStatus(FollowStatus.accepted); followRepository.save(follow)`**
Меняет статус заявки с `pending` на `accepted`. `@Transactional` гарантирует, что изменение сохранится (или откатится при ошибке).

**`rejectRequest` удаляет запись**
Отклонение заявки — просто удаление записи из таблицы `follows`. Нет смысла хранить отклонённые заявки.
