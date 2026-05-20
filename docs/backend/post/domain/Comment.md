# Comment

## Назначение

JPA-сущность комментария к посту. Поддерживает вложенность через `parentCommentId` — ответы хранятся в той же таблице, ссылаясь на ID родителя. Это простая реализация однозначной вложенности (не дерево).

## Полный разбор кода

```java
@Entity
@Table(name = "comments")
public class Comment {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long commentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String text;

    @Column(name = "parent_id")
    private Long parentCommentId;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
```

### Построчный разбор

**`@Column(name = "parent_id") private Long parentCommentId`**
Хранит ID родительского комментария как обычное число, а не как JPA-связь `@ManyToOne`. Это намеренное упрощение — для получения ответов используется отдельный запрос `findByParentIdWithCursor`, а не lazy-загрузка. Простая числовая ссылка лучше для курсорной пагинации.

**Архитектура вложенности:**
- Комментарий верхнего уровня: `parentCommentId = null`
- Ответ: `parentCommentId = <id_родителя>`
- Получение ответов: `GET /api/comments/{id}/replies`
- Глубина только одного уровня — ответы на ответы прикрепляются к оригинальному комментарию
