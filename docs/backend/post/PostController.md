# PostController

## Назначение

REST-контроллер для постов. Обрабатывает создание, получение, обновление и удаление постов. Поддерживает загрузку изображений (multipart). Получение постов пользователя реализует cursor-based пагинацию. Добавляет флаги `liked`/`saved` для авторизованных пользователей эффективным batch-запросом.

## Полный разбор кода

```java
@RestController
@RequiredArgsConstructor
public class PostController {

    @PostMapping("/api/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public PostSummaryResponse create(
            @RequestPart("data") @Valid CreatePostRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal String email) {
        return postService.create(request, image, currentUserResolver.resolve(email));
    }

    @GetMapping("/api/posts/{id}")
    public PostSummaryResponse getById(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        User viewer = email != null ? currentUserResolver.resolve(email) : null;
        Post post = postService.findById(id, viewer);
        boolean liked = viewer != null && interactionService.isLiked(id, viewer.getUserId());
        boolean saved = viewer != null && interactionService.isSaved(id, viewer.getUserId());
        return postService.toSummary(post, liked, saved);
    }

    @GetMapping("/api/users/{userId}/posts")
    public List<PostSummaryResponse> getUserPosts(
            @PathVariable Long userId,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal String email) {
        User viewer = email != null ? currentUserResolver.resolve(email) : null;
        List<Post> posts = postService.findUserPosts(userId, cursor, limit, viewer);
        return enrichWithFlags(posts, viewer);
    }

    private List<PostSummaryResponse> enrichWithFlags(List<Post> posts, User viewer) {
        if (viewer == null || posts.isEmpty()) {
            return posts.stream().map(p -> postService.toSummary(p, false, false)).toList();
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

**`@RequestPart("data") @Valid CreatePostRequest request`**
Пост создаётся multipart-запросом (JSON + необязательный файл). `@RequestPart("data")` читает JSON-часть с именем `"data"`. Fронтенд отправляет `FormData` с двумя частями: `data` (JSON строка) и `image` (файл).

**`@RequestPart(value = "image", required = false)`**
Изображение необязательно — пост может быть текстовым.

**`@RequestParam(required = false) Long cursor`**
Cursor-based пагинация. Первый запрос: без `cursor` (получаем самые новые). Следующие запросы: `cursor = lastPostId` (получаем посты старее этого ID).

**`Set<Long> postIds = posts.stream().map(Post::getPostId).collect(Collectors.toSet())`**
`Post::getPostId` — ссылка на метод, эквивалент `p -> p.getPostId()`. `Collectors.toSet()` — собирает в `HashSet` без дублей.

**Оптимизация `enrichWithFlags`:**
Вместо N запросов «лайкнул ли пользователь пост i?» делается 2 запроса — один для всех лайков, один для всех сохранений. `likedIds.contains(p.getPostId())` — O(1) проверка в HashSet.

**`@DeleteMapping("/api/posts/{id}") ... @ResponseStatus(HttpStatus.NO_CONTENT)`**
DELETE возвращает HTTP 204 — успех без тела ответа. Стандарт REST для удаления.
