# UserRepository

## Назначение

Spring Data JPA репозиторий для работы с сущностью `User`. Предоставляет методы для поиска, проверки существования и подсчёта пользователей в базе данных. Spring автоматически генерирует SQL-запросы по именам методов — писать SQL вручную не нужно.

## Полный разбор кода

```java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByNickname(String nickname);
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);
    long countByRole(UserRole role);

    @Query("""
            SELECT u FROM User u
            WHERE LOWER(u.nickname) LIKE LOWER(CONCAT('%', :q, '%'))
              AND u.isBlocked = false
              AND (:cursor IS NULL OR u.userId < :cursor)
            ORDER BY u.userId DESC
            """)
    List<User> searchByNickname(
            @Param("q") String q,
            @Param("cursor") Long cursor,
            Pageable pageable);
}
```

### Построчный разбор

**`public interface UserRepository extends JpaRepository<User, Long>`**
`interface` — не класс. Spring Data создаёт реализацию автоматически во время запуска.

`JpaRepository<User, Long>` — базовый интерфейс, предоставляющий стандартные методы:
- `save(entity)` — сохранить/обновить
- `findById(id)` — найти по ID
- `findAll()` — найти все
- `delete(entity)` — удалить
- И ещё десятки методов

`<User, Long>` — первый параметр: тип сущности, второй: тип первичного ключа.

**`Optional<User> findByEmail(String email)`**
Spring Data парсит имя метода: `findBy` + `Email` → `SELECT * FROM users WHERE email = ?`. `Optional<User>` — контейнер, который либо содержит пользователя, либо пуст. Это лучше, чем возвращать `null` — явно говорит, что пользователь может не существовать.

**`boolean existsByEmail(String email)`**
→ `SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)`. Более эффективно, чем `findByEmail(email) != null` — не загружает весь объект пользователя.

**`long countByRole(UserRole role)`**
→ `SELECT COUNT(*) FROM users WHERE role = ?`. Используется в `AdminService` для статистики.

**`@Query("...")`**
Когда имя метода не может выразить нужный запрос — пишем JPQL (Java Persistence Query Language). JPQL похож на SQL, но работает с Java-объектами, а не таблицами.

**`LOWER(u.nickname) LIKE LOWER(CONCAT('%', :q, '%'))`**
Case-insensitive поиск подстроки. `LOWER()` приводит обе стороны к нижнему регистру. `%` — маска любого количества символов в LIKE. `CONCAT('%', :q, '%')` → `%запрос%`.

**`AND (:cursor IS NULL OR u.userId < :cursor)`**
Cursor-based пагинация: загружать следующую страницу пользователей с ID меньше `cursor`. Первый запрос: `cursor = null` (получаем первую страницу). Следующий запрос: `cursor = lastUserId` (получаем следующую страницу).

**`@Param("q") String q`**
Связывает параметр метода `q` с именованным параметром `:q` в JPQL-запросе.

**`Pageable pageable`**
Объект пагинации из Spring Data. Содержит `limit` для JPQL-запроса. Передаётся из контроллера через `PageRequest.of(0, limit)`.
