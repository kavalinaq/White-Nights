# SearchController

## Назначение

REST-контроллер для глобального поиска. Поддерживает три режима: быстрый сводный поиск (`/api/search`), и три отдельных поиска с пагинацией (`/api/search/users`, `/api/search/posts`, `/api/search/tags`).

## Полный разбор кода

```java
@RestController
@RequiredArgsConstructor
public class SearchController {

    @GetMapping("/api/search")
    public SearchResponse search(
            @RequestParam String q,
            @RequestParam(defaultValue = "5") int limit) {
        validateQuery(q);
        return searchService.search(q, limit);
    }

    @GetMapping("/api/search/users")
    public List<UserSearchResult> searchUsers(
            @RequestParam String q,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int limit) {
        validateQuery(q);
        return searchService.searchUsers(q, cursor, limit);
    }

    @GetMapping("/api/search/posts")
    public List<PostSummaryResponse> searchPosts(
            @RequestParam String q,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal String email) {
        validateQuery(q);
        User viewer = email != null ? userRepository.findByEmail(email).orElse(null) : null;
        return searchService.searchPosts(q, cursor, limit, viewer);
    }

    @GetMapping("/api/search/tags")
    public List<TagResponse> searchTags(@RequestParam String q, ...) {
        validateQuery(q);
        return searchService.searchTags(q, cursor, limit);
    }

    private void validateQuery(String q) {
        if (q == null || q.isBlank()) {
            throw new IllegalArgumentException("Search query must not be empty");
        }
    }
}
```

### Построчный разбор

**`GET /api/search` — сводный поиск**
Возвращает сразу пользователей, посты и теги в одном ответе (`SearchResponse`). Использует небольшой лимит (по умолчанию 5) — для страницы быстрого поиска с превью результатов.

**`GET /api/search/users|posts|tags` — постраничный поиск**
Отдельные endpoints для полноценного поиска с cursor-based пагинацией. Вызываются при нажатии «Показать все результаты» или при открытии вкладки.

**`email != null ? userRepository.findByEmail(email).orElse(null) : null`**
Поиск постов доступен неаутентифицированным пользователям. Если пользователь не авторизован — `email` будет `null` (Spring Security не устанавливает principal). Тернарный оператор проверяет оба случая.

**`validateQuery(String q)`**
Приватный метод для валидации запроса — вынесен отдельно, чтобы не повторять одну и ту же проверку в каждом endpoint.
