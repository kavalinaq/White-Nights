# PostSummaryResponse, CreateCommentRequest, CommentResponse

## Назначение

DTO для ответов и запросов, связанных с постами и комментариями.

## Полный разбор кода

### PostSummaryResponse

```java
public record PostSummaryResponse(
        Long postId,
        String imageUrl,
        String title,
        String author,
        String description,
        LocalDateTime createdAt,
        AuthorInfo authorInfo,
        List<TagResponse> tags,
        long likeCount,
        long commentCount,
        long viewCount,
        boolean liked,
        boolean saved
) {
    public record AuthorInfo(Long userId, String nickname, String avatarUrl) {}
}
```

**`AuthorInfo` — вложенный record**
Информация об авторе поста (пользователе) сгруппирована в отдельный вложенный record, а не разбросана по полям. Клиент получает объект `authorInfo: { userId, nickname, avatarUrl }`.

**`boolean liked` / `boolean saved`**
Флаги, показывающие, лайкнул/сохранил ли текущий пользователь этот пост. Вычисляются в `PostService` через batch-проверку (`getLikedPostIds`, `getSavedPostIds`) — один запрос для всего списка постов, а не по одному.

**`long likeCount / commentCount / viewCount`**
Берутся напрямую из полей сущности `Post`, которые вычисляются через `@Formula` SQL-подзапросами при загрузке.

**`List<TagResponse> tags`**
Теги поста в виде DTO. `TagResponse` — простой record с `id` и `name`.

---

### CreateCommentRequest

```java
public record CreateCommentRequest(
        @NotBlank @Size(max = 2000) String text,
        Long parentCommentId
) {}
```

**`@Size(max = 2000)`**
Комментарии ограничены 2000 символами.

**`Long parentCommentId`**
Необязательный ID родительского комментария. `null` — комментарий верхнего уровня. Если задан — это ответ на другой комментарий. Объектный `Long` (не примитив `long`) позволяет передать `null`.

---

### CommentResponse

```java
public record CommentResponse(
        Long commentId,
        Long parentCommentId,
        String text,
        LocalDateTime createdAt,
        AuthorInfo author
) {
    public record AuthorInfo(Long userId, String nickname, String avatarUrl) {}
}
```

**`Long parentCommentId`**
Если `null` — комментарий верхнего уровня. Если задан — ответ. Клиент может использовать это для построения визуальной вложенности.

**`AuthorInfo author`**
Информация об авторе комментария. Загружается в репозитории через `JOIN FETCH c.user` чтобы не делать N+1 запросов.
