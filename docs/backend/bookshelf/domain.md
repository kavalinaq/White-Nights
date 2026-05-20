# Bookshelf Domain: Shelf, Book, BooksOnShelf

## Назначение

Три сущности для функции «книжная полка». У каждого пользователя при регистрации создаются три полки: «Хочу прочитать», «Читаю», «Прочитал». Книги хранятся отдельно и связываются с полками через промежуточную таблицу `BooksOnShelf` с сохранением порядка.

## Полный разбор кода

### Shelf

```java
@Entity
@Table(name = "shelves")
public class Shelf {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long shelfId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false)
    private int position;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

**`int position`**
Позиция полки в списке для сортировки. При создании трёх дефолтных полок: `position = 0, 1, 2`. Это позволяет отображать полки в фиксированном порядке через `findByUserOrderByPosition`.

---

### Book

```java
@Entity
@Table(name = "books")
public class Book {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bookId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 255) String title;
    @Column(nullable = false, length = 255) String author;
    @CreationTimestamp @Column(nullable = false, updatable = false) LocalDateTime createdAt;
}
```

Книга принадлежит конкретному пользователю (`user_id`). Это не общая база книг — каждый пользователь добавляет свои записи. При удалении книги удаляется запись из `books` и связанная запись в `books_on_shelves`.

---

### BooksOnShelf

```java
@Entity
@Table(name = "books_on_shelves")
public class BooksOnShelf {

    @EmbeddedId
    private ShelfBookId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("shelfId")
    @JoinColumn(name = "shelf_id")
    private Shelf shelf;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("bookId")
    @JoinColumn(name = "book_id")
    private Book book;

    @Column(nullable = false)
    private int position;

    @Embeddable
    @EqualsAndHashCode
    public static class ShelfBookId implements Serializable {
        private Long shelfId;
        private Long bookId;
    }
}
```

**Промежуточная таблица с дополнительным полем**
Обычная many-to-many связь `@ManyToMany` не позволяет хранить дополнительные данные (например, `position`). Поэтому используется явная промежуточная сущность `BooksOnShelf` с полем `position` для порядка книг на полке.

**`@EmbeddedId ShelfBookId`**
Составной ключ `(shelfId, bookId)` — одна книга может быть только на одной полке (уникальность на уровне БД).

**`int position`**
Порядок книги на полке. При добавлении берётся `MAX(position) + 1`. При перестановке через drag-and-drop — обновляется для всех затронутых книг.
