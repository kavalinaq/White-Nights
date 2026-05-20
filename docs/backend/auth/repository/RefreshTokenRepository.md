# RefreshTokenRepository

## Назначение

Репозиторий для работы с refresh-токенами в базе данных. Предоставляет методы поиска и удаления токенов — как по значению токена, так и по пользователю (для аннулирования всех сессий при смене пароля).

## Полный разбор кода

```java
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    void deleteByUser(User user);
    void deleteByToken(String token);
}
```

### Построчный разбор

**`Optional<RefreshToken> findByToken(String token)`**
→ `SELECT * FROM refresh_tokens WHERE token = ?`. Используется при обновлении токена (`/api/auth/refresh`) для проверки, что токен существует и не истёк.

**`void deleteByUser(User user)`**
→ `DELETE FROM refresh_tokens WHERE user_id = ?`. Вызывается при смене пароля — аннулирует все сессии пользователя на всех устройствах.

**`void deleteByToken(String token)`**
→ `DELETE FROM refresh_tokens WHERE token = ?`. Вызывается при выходе из системы — удаляет только текущую сессию, остальные остаются.
