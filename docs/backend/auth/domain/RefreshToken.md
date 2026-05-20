# RefreshToken

## Назначение

JPA-сущность, представляющая refresh-токен в базе данных. Refresh-токен — это долгоживущий токен (14 дней), который хранится в httpOnly cookie браузера и используется для получения нового access-токена без повторного ввода пароля. Каждый пользователь может иметь несколько refresh-токенов (с разных устройств/браузеров).

## Полный разбор кода

```java
@Entity
@Table(name = "refresh_tokens")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long tokenId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
```

### Построчный разбор

**`@ManyToOne(fetch = FetchType.LAZY)`**
Связь «многие к одному»: много refresh-токенов могут принадлежать одному пользователю (пользователь может войти с нескольких устройств).

`FetchType.LAZY` — «ленивая» загрузка: связанный объект `User` не загружается из БД автоматически при загрузке токена. Он загружается только тогда, когда к нему явно обращаются. Это оптимизация — не нужно каждый раз загружать весь профиль пользователя только чтобы проверить токен.

Альтернатива `FetchType.EAGER` — загружает связанный объект сразу, что может вызвать «проблему N+1»: при загрузке 100 токенов делается 101 SQL-запрос (1 для токенов + 100 для пользователей).

**`@JoinColumn(name = "user_id", nullable = false)`**
В таблице `refresh_tokens` будет столбец `user_id` — внешний ключ, ссылающийся на `users.user_id`. `nullable = false` — у каждого токена должен быть владелец.

**`@Column(nullable = false, unique = true) private String token`**
Сам токен — случайный UUID. `unique = true` гарантирует, что два разных пользователя не смогут получить одинаковый токен (хотя UUID делает это практически невозможным и без этого ограничения).

**`public boolean isExpired()`**
Вспомогательный метод проверки срока действия. `LocalDateTime.now().isAfter(expiresAt)` возвращает `true`, если текущее время позже времени истечения токена.
