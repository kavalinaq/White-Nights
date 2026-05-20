# BookshelfService

## Назначение

Сервис книжных полок. Управляет созданием дефолтных полок при регистрации, доступом к полкам с учётом приватности, добавлением/удалением/перемещением книг и изменением порядка.

## Полный разбор кода

```java
@Service
@RequiredArgsConstructor
public class BookshelfService {

    private static final List<String> DEFAULT_SHELF_NAMES = List.of("Want to Read", "Reading", "Read");

    @Transactional
    public void bootstrapShelves(User user) {
        for (int i = 0; i < DEFAULT_SHELF_NAMES.size(); i++) {
            shelfRepository.save(Shelf.builder()
                    .user(user)
                    .name(DEFAULT_SHELF_NAMES.get(i))
                    .position(i)
                    .build());
        }
    }

    public List<ShelfResponse> getShelves(Long userId, User viewer) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        checkReadAccess(owner, viewer);
        List<Shelf> shelves = shelfRepository.findByUserOrderByPosition(owner);
        return shelves.stream().map(this::toShelfResponse).toList();
    }

    @Transactional
    public BookResponse addBook(Long shelfId, AddBookRequest request, User user) {
        Shelf shelf = shelfRepository.findByShelfIdAndUser(shelfId, user)
                .orElseThrow(() -> new NotFoundException("Shelf not found"));

        Book book = bookRepository.save(Book.builder()
                .user(user).title(request.title()).author(request.author()).build());

        int nextPosition = booksOnShelfRepository.findMaxPosition(shelfId) + 1;
        booksOnShelfRepository.save(BooksOnShelf.builder()
                .id(new BooksOnShelf.ShelfBookId(shelfId, book.getBookId()))
                .shelf(shelf).book(book).position(nextPosition).build());

        return toBookResponse(book);
    }

    @Transactional
    public void moveBook(Long bookId, Long toShelfId, Integer position, User user) {
        BooksOnShelf existing = booksOnShelfRepository.findByBook_BookId(bookId)
                .orElseThrow(() -> new NotFoundException("Book is not on any shelf"));
        booksOnShelfRepository.delete(existing);
        booksOnShelfRepository.flush();

        int targetPosition = position != null ? position : booksOnShelfRepository.findMaxPosition(toShelfId) + 1;
        booksOnShelfRepository.save(BooksOnShelf.builder()
                .id(new BooksOnShelf.ShelfBookId(toShelfId, bookId))
                .shelf(targetShelf).book(existing.getBook()).position(targetPosition).build());
    }

    @Transactional
    public void reorderShelf(Long shelfId, List<Long> bookIds, User user) {
        List<BooksOnShelf> entries = booksOnShelfRepository.findByShelf_ShelfIdOrderByPosition(shelfId);
        for (BooksOnShelf entry : entries) {
            int newPosition = bookIds.indexOf(entry.getBook().getBookId());
            if (newPosition >= 0) {
                entry.setPosition(newPosition);
            }
        }
        booksOnShelfRepository.saveAll(entries);
    }

    private void checkReadAccess(User owner, User viewer) {
        if (!owner.isPrivate()) return;
        boolean isSelf = viewer != null && viewer.getUserId().equals(owner.getUserId());
        if (isSelf) return;
        boolean follows = viewer != null && followRepository
                .existsByFollowerAndFolloweeAndStatus(viewer, owner, FollowStatus.accepted);
        if (!follows) throw new ForbiddenException("Profile is private");
    }
}
```

### Построчный разбор

**`bootstrapShelves(User user)`**
Вызывается при регистрации пользователя из `AuthService`. Создаёт три полки с именами и позициями `0, 1, 2`. Благодаря `@Transactional` — все три создаются в одной транзакции или не создаётся ни одна.

**`findByShelfIdAndUser(shelfId, user)`**
Проверяет одновременно существование полки и то, что она принадлежит текущему пользователю. Если бы проверяли по `shelfId` отдельно, злоумышленник мог бы добавить книгу на чужую полку, угадав ID.

**`findMaxPosition(shelfId) + 1`**
Новая книга добавляется в конец — на позицию после максимальной. `COALESCE(MAX(b.position), -1)` в репозитории: если полка пустая и нет максимума, возвращается -1, и `+1 = 0` — первая позиция.

**`booksOnShelfRepository.flush()`**
При перемещении книги: сначала удаляем старую запись, делаем `flush()` чтобы SQL DELETE был отправлен в БД в рамках текущей транзакции, потом вставляем новую с тем же `bookId` но другим `shelfId`. Без `flush()` Hibernate мог бы попытаться вставить новую запись раньше удаления старой → конфликт ключа.

**`reorderShelf` — алгоритм переупорядочивания**
1. Загружаем все текущие `BooksOnShelf` для полки
2. Для каждой книги ищем её новую позицию в списке `bookIds` через `indexOf`
3. Устанавливаем новую позицию
4. Сохраняем все изменения одним `saveAll`

**`bookIds.indexOf(bookId)`**
Возвращает индекс элемента в списке. Например, если `bookIds = [5, 2, 8]` — книга с ID 5 получит `position = 0`, книга с ID 2 — `position = 1`. Если книга не в списке — `indexOf` вернёт `-1`, условие `>= 0` пропустит её.

**`checkReadAccess`**
Проверка доступа: открытый профиль (`!isPrivate`) — разрешить всем. Закрытый — только себе или принятым подписчикам. `follows = viewer != null && existsByFollowerAndFolloweeAndStatus(viewer, owner, ACCEPTED)` — нужна именно принятая подписка.
