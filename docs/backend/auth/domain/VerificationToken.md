# VerificationToken

## Назначение

JPA-сущность для токена подтверждения email. После регистрации пользователь получает письмо со ссылкой, содержащей этот токен. Пока email не подтверждён (`isVerified = false` в `User`), пользователь не может войти. Один пользователь — один токен подтверждения (`@OneToOne`).

## Полный разбор кода

```java
@Entity
@Table(name = "verification_tokens")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class VerificationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long tokenId;

    @OneToOne(fetch = FetchType.LAZY)
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

**`@OneToOne(fetch = FetchType.LAZY)`**
Связь «один к одному»: каждый пользователь может иметь не более одного токена подтверждения. Это отличает `VerificationToken` от `RefreshToken` (где `@ManyToOne` — много токенов на одного пользователя).

`FetchType.LAZY` — объект `User` загружается из БД только при обращении к нему, а не автоматически.

**`@JoinColumn(name = "user_id", nullable = false)`**
Создаёт столбец `user_id` во внешней таблице как ссылку на пользователя.

**`public boolean isExpired()`**
Токен действителен 24 часа (задаётся в `AuthService`: `LocalDateTime.now().plusHours(24)`). Этот метод проверяет, не прошло ли это время.

**Жизненный цикл токена:**
1. Создаётся при регистрации → сохраняется в БД
2. Пользователь получает письмо со ссылкой `/api/auth/verify?token=<UUID>`
3. При переходе по ссылке `AuthService.verify()` находит токен, помечает пользователя как верифицированного и **удаляет токен** — он больше не нужен
