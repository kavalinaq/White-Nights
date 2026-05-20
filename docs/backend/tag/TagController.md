# TagController

## Назначение

REST-контроллер для работы с тегами: поиск тегов по префиксу, получение недавних/популярных тегов пользователя, получение постов по тегу.

## Полный разбор кода

```java
@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    @GetMapping("/search")
    public List<TagResponse> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "10") int limit) {
        if (q == null || q.isBlank()) {
            throw new BadRequestException("Query must not be blank");
        }
        return tagService.search(q, Math.min(limit, 50)).stream()
                .map(t -> new TagResponse(t.getTagId(), t.getName()))
                .toList();
    }

    @GetMapping("/recent")
    public List<TagResponse> recent(
            @AuthenticationPrincipal String email,
            @RequestParam(defaultValue = "10") int limit) {
        Long userId = currentUserResolver.resolve(email).getUserId();
        return tagService.recent(userId, Math.min(limit, 20)).stream()
                .map(t -> new TagResponse(t.getTagId(), t.getName()))
                .toList();
    }

    @GetMapping("/{name}/posts")
    public List<PostSummaryResponse> postsByTag(
            @PathVariable String name,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int limit) {
        return postRepository.findByTagName(name, cursor, PageRequest.of(0, Math.min(limit, 50)))
                .stream()
                .map(p -> new PostSummaryResponse(...))
                .toList();
    }
}
```

### Построчный разбор

**`GET /api/tags/search?q=...`**
Поиск тегов по префиксу для автодополнения при вводе. Например, `q=фант` вернёт `[{id:1, name:"фантастика"}, ...]`.

**`q.isBlank()` дополнительная проверка**
Bean Validation не используется для `@RequestParam` в методе `/search`, поэтому проверка в коде вручную. `isBlank()` возвращает `true` для пустой строки и строки из пробелов.

**`GET /api/tags/recent`**
Возвращает недавние теги пользователя + дополняет глобально популярными, если недавних мало. Используется при создании/редактировании поста.

**`@GetMapping("/{name}/posts")`**
Получение всех постов с конкретным тегом. Теги идентифицируются по имени, а не ID — URL более читабелен (`/api/tags/фантастика/posts`).

**`false, false` в конструкторе `PostSummaryResponse`**
Флаги `liked` и `saved` установлены в `false`. Это публичный endpoint без обязательной аутентификации — не известно, лайкнул ли текущий пользователь пост. Компромисс: упрощение ценой точности.
