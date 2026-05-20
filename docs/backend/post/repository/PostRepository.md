# PostRepository

## Назначение

Репозиторий для постов с несколькими сложными JPQL-запросами. Поддерживает cursor-based пагинацию для бесконечной прокрутки, поиск по тексту и формирование ленты из постов подписок.

## Полный разбор кода

```java
public interface PostRepository extends JpaRepository<Post, Long> {

    long countByUser(User user);

    @Query("SELECT p FROM Post p JOIN p.tags t WHERE LOWER(t.name) = LOWER(:tagName) AND p.isBlocked = false AND (:cursor IS NULL OR p.postId < :cursor) ORDER BY p.postId DESC")
    List<Post> findByTagName(@Param("tagName") String tagName, @Param("cursor") Long cursor, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.user = :user AND p.isBlocked = false AND (:cursor IS NULL OR p.postId < :cursor) ORDER BY p.postId DESC")
    List<Post> findByUserWithCursor(@Param("user") User user, @Param("cursor") Long cursor, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE (LOWER(p.title) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(p.author) LIKE ... ) AND p.isBlocked = false AND (:cursor IS NULL OR p.postId < :cursor) ORDER BY p.postId DESC")
    List<Post> searchPosts(@Param("q") String q, @Param("cursor") Long cursor, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.user IN (SELECT f.followee FROM Follow f WHERE f.follower = :viewer AND f.status = :status) AND p.isBlocked = false AND (:cursor IS NULL OR p.postId < :cursor) ORDER BY p.postId DESC")
    List<Post> findFeedPosts(@Param("viewer") User viewer, @Param("status") FollowStatus status, @Param("cursor") Long cursor, Pageable pageable);
}
```

### Построчный разбор

**Cursor-based пагинация (`postId < :cursor`)**
Вместо `OFFSET` (медленно на больших данных) используется ID в качестве курсора. Первый запрос: `cursor = null` → все записи. Следующий: `cursor = lastId` → только записи со ID меньше. Это O(log n) благодаря индексу по ID, а не O(n) как у OFFSET.

**`(:cursor IS NULL OR p.postId < :cursor)`**
Если `cursor = null` — условие всегда истинно (показываем с начала). Если задан — только записи старее курсора.

**`ORDER BY p.postId DESC`**
Сортировка от новых к старым. ID автоинкрементный — больший ID = более новый пост.

**`JOIN p.tags t WHERE LOWER(t.name) = LOWER(:tagName)`**
JPQL JOIN по коллекции — разворачивает `Set<Tag>` в строки для фильтрации. `LOWER()` — регистронезависимый поиск.

**`findFeedPosts` — подзапрос**
Получение постов всех подписок — подзапрос внутри IN: `SELECT f.followee FROM Follow f WHERE f.follower = :viewer AND f.status = :status`. Это read-time лента (без fan-out) — лента вычисляется в момент запроса, а не записывается при публикации.

**`Pageable pageable`**
Добавляет LIMIT к запросу. Всегда передаётся `PageRequest.of(0, limit)` — страница 0, ограничение `limit`.
