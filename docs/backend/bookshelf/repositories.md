# ShelfRepository, BookRepository, BooksOnShelfRepository

## Назначение

Три репозитория для книжных полок. `ShelfRepository` и `BookRepository` используют Spring Data методы-запросы. `BooksOnShelfRepository` содержит нативный запрос для получения максимальной позиции.

## Полный разбор кода

### ShelfRepository

```java
public interface ShelfRepository extends JpaRepository<Shelf, Long> {

    List<Shelf> findByUserOrderByPosition(User user);

    Optional<Shelf> findByShelfIdAndUser(Long shelfId, User user);
}
```

**`findByUserOrderByPosition`**
Spring Data разбирает имя метода: `findBy` + `User` (WHERE user = ?) + `OrderBy` + `Position` (ORDER BY position). Возвращает полки в порядке их отображения.

**`findByShelfIdAndUser`**
Двойная проверка: полка существует И принадлежит указанному пользователю. Предотвращает доступ к чужим полкам.

---

### BookRepository

```java
public interface BookRepository extends JpaRepository<Book, Long> {
    Optional<Book> findByBookIdAndUser(Long bookId, User user);
}
```

Аналогично `ShelfRepository` — проверяет, что книга принадлежит пользователю при удалении.

---

### BooksOnShelfRepository

```java
public interface BooksOnShelfRepository extends JpaRepository<BooksOnShelf, BooksOnShelf.ShelfBookId> {

    List<BooksOnShelf> findByShelf_ShelfIdOrderByPosition(Long shelfId);

    Optional<BooksOnShelf> findByBook_BookId(Long bookId);

    @Query("SELECT COALESCE(MAX(b.position), -1) FROM BooksOnShelf b WHERE b.shelf.shelfId = :shelfId")
    int findMaxPosition(@Param("shelfId") Long shelfId);
}
```

**`findByShelf_ShelfIdOrderByPosition`**
`_` в имени метода обозначает навигацию по вложенным полям: `Shelf_ShelfId` = `shelf.shelfId`. Spring Data генерирует JOIN и фильтр по `shelf.shelfId = ?`. Сортирует по `position` для отображения в правильном порядке.

**`findByBook_BookId`**
Находит запись по `book.bookId`. Используется при перемещении и удалении книги — нужно найти, на какой полке она сейчас.

**`COALESCE(MAX(b.position), -1)`**
`MAX()` на пустой таблице возвращает `NULL`. `COALESCE(NULL, -1)` = `-1`. Благодаря этому при добавлении первой книги: `-1 + 1 = 0` — корректная первая позиция.
