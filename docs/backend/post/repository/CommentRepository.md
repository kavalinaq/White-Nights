# CommentRepository

## Назначение

Репозиторий для комментариев с cursor-based пагинацией. Поддерживает два режима загрузки: комментарии верхнего уровня к посту и ответы на конкретный комментарий. В обоих случаях используется `JOIN FETCH` для загрузки автора комментария за один запрос.

## Полный разбор кода

```java
public interface CommentRepository extends JpaRepository<Comment, Long> {

    @Query("""
            SELECT c FROM Comment c
            JOIN FETCH c.user
            WHERE c.post.postId = :postId
              AND c.parentCommentId IS NULL
              AND (:cursor IS NULL OR c.commentId > :cursor)
            ORDER BY c.commentId ASC
            """)
    List<Comment> findByPostIdWithCursor(
            @Param("postId") Long postId,
            @Param("cursor") Long cursor,
            Pageable pageable);

    @Query("""
            SELECT c FROM Comment c
            JOIN FETCH c.user
            WHERE c.parentCommentId = :parentId
              AND (:cursor IS NULL OR c.commentId > :cursor)
            ORDER BY c.commentId ASC
            """)
    List<Comment> findByParentIdWithCursor(
            @Param("parentId") Long parentId,
            @Param("cursor") Long cursor,
            Pageable pageable);
}
```

### Построчный разбор

**`JOIN FETCH c.user`**
При загрузке комментария JPA попробует лениво загрузить `User` при первом обращении — это N+1 запросов для списка. `JOIN FETCH` решает это: один JOIN-запрос загружает комментарии вместе с пользователями.

**`c.parentCommentId IS NULL`**
Выбирает только комментарии верхнего уровня (не ответы). `parentCommentId = null` означает, что комментарий не является ответом на другой.

**`c.commentId > :cursor` (ASC)**
Комментарии сортируются от старых к новым (`ASC`), поэтому курсор работает в противоположном направлении по сравнению с постами: берём записи с ID **больше** курсора, а не меньше. Первая загрузка — `cursor = null` (без фильтра).

**`c.parentCommentId = :parentId`**
В `findByParentIdWithCursor` нет фильтра `c.post.postId = :postId` — достаточно `parentId`, так как ответы однозначно привязаны к родительскому комментарию, а тот — к посту. Валидация принадлежности поста происходит на уровне сервиса при добавлении ответа.

**`Pageable pageable`**
Добавляет LIMIT к запросу. Вызывается как `PageRequest.of(0, limit)`.
