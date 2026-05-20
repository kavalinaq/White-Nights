# VerificationTokenRepository

## Назначение

Репозиторий для токенов подтверждения email. Минимальный интерфейс — только поиск по значению токена, плюс стандартные методы `JpaRepository` (save, delete).

## Полный разбор кода

```java
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    Optional<VerificationToken> findByToken(String token);
}
```

### Построчный разбор

**`Optional<VerificationToken> findByToken(String token)`**
→ `SELECT * FROM verification_tokens WHERE token = ?`. Вызывается в `AuthService.verify()` когда пользователь переходит по ссылке из письма. После успешной верификации токен удаляется через унаследованный `delete(entity)` из `JpaRepository`.
