# UserBlock

## Назначение

JPA-сущность блокировки пользователя. Пользователь `blocker` блокирует `blocked`. Использует тот же паттерн составного ключа, что и `Follow`. Заблокированный пользователь не может взаимодействовать с блокирующим.

## Полный разбор кода

```java
@Entity
@Table(name = "user_blocks")
public class UserBlock {

    @EmbeddedId
    private UserBlockId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("blockerId")
    @JoinColumn(name = "blocker_id")
    private User blocker;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("blockedId")
    @JoinColumn(name = "blocked_id")
    private User blocked;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Embeddable
    @EqualsAndHashCode
    public static class UserBlockId implements Serializable {
        @Column(name = "blocker_id")
        private Long blockerId;

        @Column(name = "blocked_id")
        private Long blockedId;
    }
}
```

### Построчный разбор

Структура идентична `Follow` — тот же паттерн составного ключа `@EmbeddedId`. Ключевое отличие: здесь нет статуса — блокировка либо есть, либо нет.

**`@Builder.Default private LocalDateTime createdAt = LocalDateTime.now()`**
В отличие от `Follow` (используется `@CreationTimestamp` Hibernate), здесь время устанавливается Java при создании объекта через `LocalDateTime.now()`. Оба подхода работают, но `@CreationTimestamp` устанавливает время только при сохранении в БД, `LocalDateTime.now()` — при создании объекта в памяти.

**`@Column(name = "blocker_id")` в `UserBlockId`**
Явно задаёт имена столбцов внутри `@Embeddable`. Нужно, чтобы не было конфликта с именами столбцов из `@MapsId`.
