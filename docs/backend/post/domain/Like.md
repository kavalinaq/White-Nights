# Like, Save, View

## Назначение

Три JPA-сущности для записи взаимодействий пользователя с постом: лайк (`Like`), сохранение в закладки (`Save`) и просмотр (`View`). Все три устроены идентично — используют составной первичный ключ `(userId, postId)` для гарантии уникальности на уровне базы данных.

## Полный разбор кода (на примере Like)

```java
@Entity
@Table(name = "likes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Like {

    @EmbeddedId
    private UserPostId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("postId")
    @JoinColumn(name = "post_id")
    private Post post;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Embeddable
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
    public static class UserPostId implements Serializable {
        private Long userId;
        private Long postId;
    }
}
```

### Построчный разбор

**`@EmbeddedId private UserPostId id`**
Вместо одного автогенерируемого `@Id` используется составной ключ — объект `UserPostId`, который содержит два поля: `userId` и `postId`. `@EmbeddedId` означает, что JPA берёт первичный ключ из встроенного объекта, а не из примитивного поля.

**`@Embeddable public static class UserPostId implements Serializable`**
`@Embeddable` — аннотация, которая говорит JPA, что этот класс не является самостоятельной сущностью, а встраивается в другую. `implements Serializable` — обязательное требование JPA для составных ключей: JPA использует сериализацию для кэширования.

**`@EqualsAndHashCode`**
Lombok генерирует `equals()` и `hashCode()` на основе полей класса (`userId` + `postId`). Это критично: JPA использует `equals`/`hashCode` для сравнения ключей при поиске сущностей в кэше первого уровня.

**`@MapsId("userId")` / `@MapsId("postId")`**
Связывает JPA-связь (`@ManyToOne`) с конкретным полем составного ключа. Это позволяет одновременно иметь и объект `User user` (для lazy-загрузки), и число `userId` внутри `UserPostId` — они указывают на одну и ту же колонку в БД.

**`fetch = FetchType.LAZY`**
Объект `User` и `Post` загружаются из БД только при первом обращении к ним — не автоматически. Это экономит ресурсы: часто нужен только `userId` из составного ключа, а не весь объект пользователя.

**Идемпотентность**
Составной ключ `(userId, postId)` уникален в БД — нельзя лайкнуть один пост дважды. В сервисе дополнительно проверяется `existsById(id)`, чтобы не возникала ошибка дублирования ключа.

### Различия между Like, Save, View

| Сущность | Таблица | Используется для |
|----------|---------|-----------------|
| `Like` | `likes` | Лайки постов |
| `Save` | `save` | Закладки (сохранённые посты) |
| `View` | `views` | Просмотры постов |

Все три класса имеют идентичную структуру. Различается только имя таблицы (`@Table(name = "...")`) и имя Java-класса.
