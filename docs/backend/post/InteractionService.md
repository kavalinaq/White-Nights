# InteractionService

## Назначение

Сервис взаимодействий с постами: лайки, сохранения, просмотры, комментарии. Использует составные ключи (user_id + post_id) для идемпотентности операций. Предоставляет batch-методы для эффективной проверки лайков/сохранений сразу для нескольких постов.

## Ключевые паттерны

### Идемпотентность через составной ключ

```java
public void like(Long postId, User user) {
    Post post = requirePost(postId);
    Like.UserPostId id = new Like.UserPostId(user.getUserId(), postId);
    if (!likeRepository.existsById(id)) {
        likeRepository.save(Like.builder().id(id).user(user).post(post).build());
    }
}
```

`existsById` проверяет, что лайк ещё не поставлен. Составной ключ `(userId, postId)` на уровне БД гарантирует уникальность даже при гонке потоков.

### Batch-проверка

```java
public Set<Long> getLikedPostIds(Long userId, Collection<Long> postIds) {
    if (postIds.isEmpty()) return Set.of();
    return likeRepository.findLikedPostIds(userId, postIds);
}
```

Вместо N запросов `isLiked(postId)` делается один запрос `findLikedPostIds(userId, postIds)` → `WHERE user_id = ? AND post_id IN (...)`. Возвращает `Set<Long>` — ID постов, которые пользователь лайкнул. Проверка `likedIds.contains(postId)` — O(1).

### Вложенные комментарии

```java
public CommentResponse addComment(Long postId, String text, Long parentCommentId, User user) {
    if (parentCommentId != null) {
        Comment parent = commentRepository.findById(parentCommentId)...;
        if (!parent.getPost().getPostId().equals(postId)) {
            throw new ForbiddenException("Parent comment does not belong to this post");
        }
    }
    ...
}
```
Проверяем, что родительский комментарий принадлежит тому же посту — защита от подделки.

### Права на удаление комментария

```java
boolean isCommentAuthor = comment.getUser().getUserId().equals(user.getUserId());
boolean isPostOwner = comment.getPost().getUser().getUserId().equals(user.getUserId());
boolean isModerator = user.getRole() == UserRole.moderator || user.getRole() == UserRole.admin;

if (!isCommentAuthor && !isPostOwner && !isModerator) {
    throw new ForbiddenException("Access denied");
}
```
Удалить комментарий может: автор комментария, владелец поста (у себя под постом), модератор/администратор.

### `PostSummaryHelper`

```java
public record PostSummaryHelper(Post post, Long postId) {}
```
Вспомогательный record для возврата данных из `getSavedPosts`. Используется в `FeedController`.
