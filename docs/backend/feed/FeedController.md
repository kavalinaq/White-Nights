# FeedController

## Назначение

REST-контроллер для получения ленты постов текущего пользователя. Возвращает посты от пользователей, на которых подписан текущий пользователь. Использует cursor-based пагинацию и batch-обогащение флагами `liked`/`saved`.

## Полный разбор кода

```java
@RestController
@RequiredArgsConstructor
public class FeedController {

    @GetMapping("/api/feed")
    public List<PostSummaryResponse> getFeed(
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal String email) {
        User viewer = currentUserResolver.resolve(email);
        List<Post> posts = feedService.getFeed(viewer, cursor, limit);
        return enrichWithFlags(posts, viewer);
    }

    private List<PostSummaryResponse> enrichWithFlags(List<Post> posts, User viewer) {
        if (posts.isEmpty()) {
            return List.of();
        }
        Set<Long> postIds = posts.stream().map(Post::getPostId).collect(Collectors.toSet());
        Set<Long> likedIds = interactionService.getLikedPostIds(viewer.getUserId(), postIds);
        Set<Long> savedIds = interactionService.getSavedPostIds(viewer.getUserId(), postIds);
        return posts.stream()
                .map(p -> postService.toSummary(p, likedIds.contains(p.getPostId()), savedIds.contains(p.getPostId())))
                .toList();
    }
}
```

### Построчный разбор

**`feedService.getFeed(viewer, cursor, limit)`**
Получает список объектов `Post` из базы данных — только сырые данные, без флагов лайка/сохранения.

**`enrichWithFlags`**
Приватный метод для обогащения списка постов флагами. Двухшаговый процесс: сначала получить данные, потом обогатить. Это важный паттерн для эффективности.

**`posts.stream().map(Post::getPostId).collect(Collectors.toSet())`**
Извлекает все ID постов в `Set<Long>`. Ссылка на метод `Post::getPostId` эквивалентна лямбде `p -> p.getPostId()`.

**`interactionService.getLikedPostIds(viewer.getUserId(), postIds)`**
Один SQL-запрос с `IN (...)` для всех постов сразу. Возвращает `Set<Long>` — ID постов, которые пользователь лайкнул. Это предотвращает N+1 проблему.

**`likedIds.contains(p.getPostId())`**
Проверка за O(1) — `HashSet.contains` не перебирает все элементы, а вычисляет hash. При 1000 постов: 1000 проверок за O(1) каждая.

**`posts.stream().map(...).toList()`**
Конечный `.toList()` (Java 16+) создаёт неизменяемый список. Короче, чем `.collect(Collectors.toList())`.
