# BookshelfController

## Назначение

REST-контроллер для книжных полок. Поддерживает чтение полок пользователя (с проверкой приватности), добавление и удаление книг, перемещение книги между полками, изменение порядка книг на полке (drag-and-drop).

## Полный разбор кода

```java
@RestController
@RequiredArgsConstructor
public class BookshelfController {

    @GetMapping("/api/users/{userId}/shelves")
    public List<ShelfResponse> getShelves(
            @PathVariable Long userId,
            @AuthenticationPrincipal String email) {
        User viewer = email != null ? currentUserResolver.resolve(email) : null;
        return bookshelfService.getShelves(userId, viewer);
    }

    @PostMapping("/api/shelves/{shelfId}/books")
    @ResponseStatus(HttpStatus.CREATED)
    public BookResponse addBook(
            @PathVariable Long shelfId,
            @RequestBody @Valid AddBookRequest request,
            @AuthenticationPrincipal String email) {
        return bookshelfService.addBook(shelfId, request, currentUserResolver.resolve(email));
    }

    @DeleteMapping("/api/books/{bookId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBook(@PathVariable Long bookId, @AuthenticationPrincipal String email) {
        bookshelfService.deleteBook(bookId, currentUserResolver.resolve(email));
    }

    @PostMapping("/api/books/{bookId}/move")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void moveBook(
            @PathVariable Long bookId,
            @RequestBody @Valid MoveBookRequest request,
            @AuthenticationPrincipal String email) {
        bookshelfService.moveBook(bookId, request.toShelfId(), request.position(), currentUserResolver.resolve(email));
    }

    @PostMapping("/api/shelves/{shelfId}/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorderShelf(
            @PathVariable Long shelfId,
            @RequestBody @Valid ReorderShelfRequest request,
            @AuthenticationPrincipal String email) {
        bookshelfService.reorderShelf(shelfId, request.bookIds(), currentUserResolver.resolve(email));
    }
}
```

### Построчный разбор

**`GET /api/users/{userId}/shelves`**
Публичный endpoint с опциональной аутентификацией. `email != null` — проверка, авторизован ли пользователь. `viewer = null` для анонимных запросов, при этом проверка приватности в сервисе блокирует доступ к закрытым профилям.

**`POST /api/shelves/{shelfId}/books` — добавление книги**
Книга добавляется на конкретную полку. Сервис проверяет, что полка принадлежит текущему пользователю.

**`POST /api/books/{bookId}/move` — перемещение**
`MoveBookRequest` содержит `toShelfId` (целевая полка) и опциональный `position` (куда в порядке). Если `position = null` — книга добавляется в конец целевой полки.

**`POST /api/shelves/{shelfId}/reorder` — переупорядочивание**
`ReorderShelfRequest` содержит `bookIds` — новый порядок ID книг. Сервис перебирает текущие книги на полке и обновляет им `position` согласно новому порядку.
