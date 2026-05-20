# PasswordResetTokenRepository

## Назначение

Репозиторий для токенов сброса пароля. Помимо поиска по токену, умеет удалять токен по ID пользователя — это нужно для замены старого токена сброса на новый.

## Полный разбор кода

```java
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
    void deleteByUser_UserId(Long userId);
}
```

### Построчный разбор

**`void deleteByUser_UserId(Long userId)`**
Составное имя метода с подчёркиванием. Spring Data трактует `User_UserId` как навигацию по связи: `token.user.userId`. Результирующий SQL:
```sql
DELETE FROM password_reset_tokens 
WHERE user_id = ?
```
Вызывается в `AuthService.requestPasswordReset()` перед созданием нового токена, чтобы не накапливались старые неиспользованные токены.
