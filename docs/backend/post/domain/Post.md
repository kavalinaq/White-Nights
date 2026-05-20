# Post

## Назначение

JPA-сущность поста. Пост — это рецензия или заметка о книге с заголовком, автором книги, описанием и необязательным изображением. Счётчики лайков, комментариев и просмотров вычисляются через SQL-формулы прямо при загрузке.

## Полный разбор кода

```java
@Entity
@Table(name = "posts")
public class Post {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long postId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String imageUrl;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 120)
    private String author; // Автор книги, не поста

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private boolean isBlocked = false;

    @ManyToMany
    @JoinTable(
        name = "post_and_tag",
        joinColumns = @JoinColumn(name = "post_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    @Formula("(SELECT COUNT(*) FROM likes l WHERE l.post_id = post_id)")
    private long likeCount;

    @Formula("(SELECT COUNT(*) FROM comments c WHERE c.post_id = post_id)")
    private long commentCount;

    @Formula("(SELECT COUNT(*) FROM views v WHERE v.post_id = post_id)")
    private long viewCount;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

### Построчный разбор

**`@ManyToMany @JoinTable(...)`**
Связь «многие ко многим» между постами и тегами. JPA создаёт таблицу-связку `post_and_tag` с двумя столбцами: `post_id` и `tag_id`. `joinColumns` — столбец для Post, `inverseJoinColumns` — для Tag.

**`@Builder.Default private Set<Tag> tags = new HashSet<>()`**
При создании поста через Builder, если теги не заданы — инициализируется пустым HashSet, а не `null`. Без `@Builder.Default` поле было бы `null`, что вызвало бы `NullPointerException` при `post.getTags().stream()`.

**`@Formula("(SELECT COUNT(*) FROM likes l WHERE l.post_id = post_id)")`**
Hibernate-аннотация, добавляющая вычисляемое поле. SQL-подзапрос выполняется при каждой загрузке сущности. `post_id` в подзапросе — это алиас столбца текущей строки таблицы `posts`. Это удобнее, чем хранить счётчик отдельно и обновлять при каждом лайке.

**`isBlocked`**
Флаг модерации — заблокированный пост не показывается в лентах и поисковой выдаче. Все JPQL-запросы включают фильтр `AND p.isBlocked = false`.

**`String author`**
Автор КНИГИ (не пользователя-автора поста). Например: `"Достоевский"`. Пользователь-автор поста хранится в `user`.
