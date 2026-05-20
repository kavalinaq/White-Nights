# PasswordResetToken

## Назначение

JPA-сущность для токена сброса пароля. Когда пользователь забыл пароль и запрашивает его сброс — генерируется этот токен, отправляется на email в виде ссылки. Структура почти идентична `VerificationToken`, но используется для другой цели.

## Полный разбор кода

```java
@Entity
@Table(name = "password_reset_tokens")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class PasswordResetToken {

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

Класс идентичен `VerificationToken` по структуре. Ключевые отличия в использовании:

**`@OneToOne`** — один пользователь, один токен сброса пароля. Перед созданием нового токена старый удаляется (`passwordResetTokenRepository.deleteByUser_UserId(user.getUserId())`), чтобы не накапливались старые запросы.

**Жизненный цикл:**
1. Пользователь запрашивает сброс пароля → старый токен удаляется, создаётся новый
2. Отправляется письмо с ссылкой `/reset-password?token=<UUID>`
3. Пользователь вводит новый пароль → `AuthService.resetPassword()` проверяет токен, обновляет пароль, удаляет токен **и все refresh-токены** (аннулирует все сессии)

**Срок жизни:** 24 часа (задаётся в `AuthService`).
