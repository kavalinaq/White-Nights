# InteractionController

## Назначение

REST-контроллер для взаимодействий с постами: лайки, сохранения, просмотры, комментарии. Все операции идемпотентны — повторное действие не создаёт дублей. Комментарии поддерживают вложенность (ответы).

## Полный разбор кода

```java
@RestController
@RequiredArgsConstructor
public class InteractionController {

    @PostMapping("/api/posts/{id}/like")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void like(@PathVariable Long id, @AuthenticationPrincipal String email) {
        interactionService.like(id, currentUserResolver.resolve(email));
    }

    @DeleteMapping("/api/posts/{id}/like")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlike(@PathVariable Long id, @AuthenticationPrincipal String email) { ... }

    @PostMapping("/api/posts/{id}/view")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void view(@PathVariable Long id, @AuthenticationPrincipal String email) { ... }

    @GetMapping("/api/posts/{id}/comments")
    public List<CommentResponse> getComments(
            @PathVariable Long id,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int limit) {
        return interactionService.getComments(id, cursor, limit);
    }

    @PostMapping("/api/posts/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse addComment(
            @PathVariable Long id,
            @RequestBody @Valid CreateCommentRequest request,
            @AuthenticationPrincipal String email) {
        return interactionService.addComment(id, request.text(), request.parentCommentId(), ...);
    }

    @GetMapping("/api/comments/{id}/replies")
    public List<CommentResponse> getReplies(
            @PathVariable Long id,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int limit) {
        return interactionService.getReplies(id, cursor, limit);
    }

    @DeleteMapping("/api/comments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(@PathVariable Long id, @AuthenticationPrincipal String email) { ... }
}
```

### Построчный разбор

**Лайк/просмотр/сохранение — POST+DELETE пара**
Используется паттерн REST для toggle-операций: `POST /api/posts/{id}/like` — лайкнуть, `DELETE /api/posts/{id}/like` — убрать лайк. Все три (`like`, `save`, `view`) идемпотентны: повторный вызов не создаёт дубль благодаря проверке в сервисе.

**`@ResponseStatus(HttpStatus.NO_CONTENT)`**
Возвращает HTTP 204 — успех без тела ответа. Это стандарт REST для операций, которые ничего не возвращают.

**`request.parentCommentId()`**
Комментарий может быть ответом на другой. `parentCommentId` — необязательный ID родительского комментария. Если `null` — комментарий верхнего уровня.

**`GET /api/comments/{id}/replies`**
Отдельный endpoint для вложенных комментариев (ответов). Это cursor-based пагинация — можно загружать ответы постепенно.
