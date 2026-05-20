# UserBlockRepository

## Назначение

Репозиторий для блокировок пользователей. Использует только стандартные методы `JpaRepository` — `existsById`, `save`, `deleteById`.

## Полный разбор кода

```java
public interface UserBlockRepository extends JpaRepository<UserBlock, UserBlock.UserBlockId> {
}
```

### Построчный разбор

Интерфейс пуст — все нужные операции уже есть в `JpaRepository`:

- `existsById(UserBlock.UserBlockId)` — проверить, заблокирован ли пользователь
- `save(UserBlock)` — заблокировать
- `deleteById(UserBlock.UserBlockId)` — разблокировать

**Использование в `ProfileController`:**
```java
// Проверка блокировки
userBlockRepository.existsById(new UserBlock.UserBlockId(blockerId, blockedId));

// Блокировка
userBlockRepository.save(UserBlock.builder().id(id).blocker(blocker).blocked(blocked).build());

// Разблокировка
userBlockRepository.deleteById(new UserBlock.UserBlockId(blockerId, blockedId));
```
