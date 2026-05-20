# LikeRepository, SaveRepository, ViewRepository

## Назначение

Репозитории для взаимодействий пользователя с постами. `LikeRepository` и `SaveRepository` содержат batch-запросы для эффективной проверки лайков/сохранений сразу для нескольких постов. `ViewRepository` — минимальный, без дополнительных методов.

## Полный разбор кода

### LikeRepository

```java
public interface LikeRepository extends JpaRepository<Like, Like.UserPostId> {

    @Query("SELECT l.id.postId FROM Like l WHERE l.id.userId = :userId AND l.id.postId IN :postIds")
    Set<Long> findLikedPostIds(@Param("userId") Long userId, @Param("postIds") Collection<Long> postIds);
}
```

**`JpaRepository<Like, Like.UserPostId>`**
Второй параметр — тип первичного ключа. Здесь ключ составной (`UserPostId`), поэтому указывается вложенный класс через `Like.UserPostId`.

**`SELECT l.id.postId FROM Like l`**
JPQL-запрос обращается к полям объекта напрямую: `l.id` — это `UserPostId`, `l.id.postId` — поле `postId` внутри него. В SQL это транслируется в `SELECT post_id FROM likes`.

**`l.id.postId IN :postIds`**
Фильтр по списку ID постов. Транслируется в `WHERE post_id IN (1, 2, 3, ...)`. Позволяет сделать один запрос вместо N отдельных.

**`Collection<Long> postIds`**
Принимает любую коллекцию (List, Set) — это гибкий тип. Spring Data передаёт её в SQL как список значений для `IN`.

**`Set<Long>`**
Возвращает множество ID постов, которые пользователь лайкнул. Использование `Set` вместо `List` — проверка `likedIds.contains(postId)` выполняется за O(1), а не O(n).

---

### SaveRepository

```java
public interface SaveRepository extends JpaRepository<Save, Save.UserPostId> {

    @Query("SELECT s.id.postId FROM Save s WHERE s.id.userId = :userId AND s.id.postId IN :postIds")
    Set<Long> findSavedPostIds(@Param("userId") Long userId, @Param("postIds") Collection<Long> postIds);

    @Query("""
            SELECT s FROM Save s
            JOIN FETCH s.post p
            WHERE s.id.userId = :userId
              AND p.isBlocked = false
              AND (:cursor IS NULL OR s.id.postId < :cursor)
            ORDER BY s.id.postId DESC
            """)
    List<Save> findByUserIdWithCursor(
            @Param("userId") Long userId,
            @Param("cursor") Long cursor,
            Pageable pageable);
}
```

**`JOIN FETCH s.post p`**
Обычный `JOIN` загружает `Save`, но `Post` остаётся ленивым и загрузится отдельным запросом при обращении. `JOIN FETCH` загружает `Save` и `Post` одним SQL-запросом через JOIN, избегая N+1 проблему.

**`p.isBlocked = false`**
Фильтрует заблокированные посты — даже если пост сохранён, но потом заблокирован модератором, он не появится в списке сохранённых.

**`s.id.postId < :cursor`**
Cursor-based пагинация по `postId` внутри составного ключа. Работает так же, как в `PostRepository`: следующая страница загружает записи с ID меньше последнего загруженного.

---

### ViewRepository

```java
public interface ViewRepository extends JpaRepository<View, View.UserPostId> {}
```

Пустой интерфейс — все нужные операции предоставляет `JpaRepository` (метод `save()` для записи просмотра, `existsById()` для проверки дубля). Дополнительные запросы не нужны.
