# Follow

## Назначение

JPA-сущность, представляющая связь подписки между двумя пользователями. Использует составной первичный ключ (`follower_id + followee_id`) вместо автогенерируемого ID. Статус (`pending`/`accepted`) обслуживает приватные аккаунты.

## Полный разбор кода

```java
@Entity
@Table(name = "follows")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Follow {

    @EmbeddedId
    private FollowId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("followerId")
    @JoinColumn(name = "follower_id")
    private User follower;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("followeeId")
    @JoinColumn(name = "followee_id")
    private User followee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FollowStatus status;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Embeddable
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
    public static class FollowId implements Serializable {
        private Long followerId;
        private Long followeeId;
    }
}
```

### Построчный разбор

**`@EmbeddedId`**
Вместо `@Id @GeneratedValue` используется встраиваемый составной ключ. Первичный ключ таблицы `follows` состоит из двух столбцов: `follower_id` + `followee_id`. Это гарантирует, что один пользователь не может подписаться на другого дважды.

**`@Embeddable`**
`FollowId` — встраиваемый класс (не отдельная таблица). Его поля становятся частью таблицы `Follow`.

**`@MapsId("followerId")`**
Связывает поле `follower` (`@ManyToOne`) с частью составного ключа `followerId`. JPA автоматически заполняет `id.followerId` значением `follower.userId`.

**`@EqualsAndHashCode`**
Lombok генерирует `equals()` и `hashCode()` по всем полям. Это критично для `EmbeddedId`: JPA использует эти методы для нахождения объектов в кэше и сравнения ключей.

**`implements Serializable`**
JPA требует, чтобы классы составных ключей реализовывали `Serializable`. Это позволяет передавать ключ через сетевые слои и хранить в кэше.

**`static class FollowId`**
Статический вложенный класс — можно создать `new Follow.FollowId(1L, 2L)` без создания объекта `Follow`. Нестатический внутренний класс требовал бы экземпляра родителя.
