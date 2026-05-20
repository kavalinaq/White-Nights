# FollowRepository

## Назначение

Репозиторий для работы с таблицей подписок. Предоставляет методы подсчёта, поиска и фильтрации подписок по пользователю и статусу. Первичный ключ — составной тип `Follow.FollowId`.

## Полный разбор кода

```java
public interface FollowRepository extends JpaRepository<Follow, Follow.FollowId> {
    long countByFolloweeAndStatus(User followee, FollowStatus status);
    long countByFollowerAndStatus(User follower, FollowStatus status);
    Optional<Follow> findByFollowerAndFollowee(User follower, User followee);
    boolean existsByFollowerAndFolloweeAndStatus(User follower, User followee, FollowStatus status);
    List<Follow> findByFolloweeAndStatus(User followee, FollowStatus status, Pageable pageable);
    List<Follow> findByFollowerAndStatus(User follower, FollowStatus status, Pageable pageable);
}
```

### Построчный разбор

**`JpaRepository<Follow, Follow.FollowId>`**
Второй параметр — тип первичного ключа. Здесь `Follow.FollowId` — составной ключ. `findById(new Follow.FollowId(1L, 2L))` проверяет наличие конкретной подписки.

**`countByFolloweeAndStatus`**
→ `SELECT COUNT(*) FROM follows WHERE followee_id = ? AND status = ?`. Используется для счётчика подписчиков в профиле.

**`countByFollowerAndStatus`**
→ `SELECT COUNT(*) FROM follows WHERE follower_id = ? AND status = ?`. Счётчик подписок.

**`findByFollowerAndFollowee`**
→ `SELECT * FROM follows WHERE follower_id = ? AND followee_id = ?`. Возвращает `Optional` — проверить статус подписки между двумя конкретными пользователями.

**`findByFolloweeAndStatus(User, FollowStatus, Pageable)`**
→ `SELECT * FROM follows WHERE followee_id = ? AND status = ? LIMIT ? OFFSET ?`. Список подписчиков с пагинацией. `Pageable` добавляет `LIMIT`/`OFFSET`.

**`findByFollowerAndStatus(User, FollowStatus, Pageable)`**
Список подписок (на кого подписан данный пользователь).
