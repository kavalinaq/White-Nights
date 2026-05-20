# Tag, TagRepository, TagResponse

## Назначение

Тег — простая сущность с именем. Теги связаны с постами через таблицу `post_and_tag` (many-to-many). `TagRepository` содержит запросы для поиска и получения популярных тегов. `TagResponse` — DTO для передачи тега клиенту.

## Полный разбор кода

### Tag

```java
@Entity
@Table(name = "tags")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long tagId;

    @Column(unique = true, nullable = false, length = 50)
    private String name;
}
```

**`unique = true`**
На уровне БД создаётся уникальный индекс на колонку `name`. Это гарантирует, что два тега с одинаковым именем не могут существовать. `findOrCreate` в сервисе работает корректно именно благодаря этому ограничению.

---

### TagRepository

```java
public interface TagRepository extends JpaRepository<Tag, Long> {

    Optional<Tag> findByNameIgnoreCase(String name);

    @Query("SELECT t FROM Tag t WHERE LOWER(t.name) LIKE LOWER(CONCAT(:prefix, '%')) ORDER BY t.name")
    List<Tag> searchByPrefix(@Param("prefix") String prefix, Pageable pageable);

    @Query(value = """
            SELECT t.tag_id, t.name
            FROM tags t
            JOIN post_and_tag pt ON pt.tag_id = t.tag_id
            JOIN posts p ON p.post_id = pt.post_id
            WHERE p.user_id = :userId
            ORDER BY p.created_at DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Tag> findRecentByUser(@Param("userId") Long userId, @Param("limit") int limit);

    @Query(value = """
            SELECT t.tag_id, t.name
            FROM tags t
            JOIN post_and_tag pt ON pt.tag_id = t.tag_id
            GROUP BY t.tag_id, t.name
            ORDER BY COUNT(*) DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Tag> findGlobalPopular(@Param("limit") int limit);
}
```

**`Optional<Tag> findByNameIgnoreCase(String name)`**
Spring Data автоматически генерирует SQL из имени метода: `WHERE LOWER(name) = LOWER(:name)`. `IgnoreCase` — суффикс, добавляющий регистронезависимость.

**`LOWER(t.name) LIKE LOWER(CONCAT(:prefix, '%'))`**
Поиск по префиксу — начало строки совпадает с запросом. `%` в конце — любые символы после. `LOWER()` с обеих сторон — регистронезависимый поиск.

**`nativeQuery = true`**
Запрос написан на SQL, а не JPQL. Используется для сложных запросов с `GROUP BY` и `JOIN` через таблицу-связку `post_and_tag`, которые сложнее выразить через JPQL.

**`findRecentByUser`**
Ищет теги из последних постов пользователя через двойной JOIN: `tags → post_and_tag → posts`. Сортирует по дате поста (`ORDER BY p.created_at DESC`) — сначала теги из более свежих постов.

**`findGlobalPopular`**
`COUNT(*)` считает, сколько постов используют каждый тег. `GROUP BY t.tag_id, t.name` — обязательно в SQL при агрегации, иначе ошибка. `ORDER BY COUNT(*) DESC` — сначала самые популярные.

---

### TagResponse

```java
public record TagResponse(Long tagId, String name) {}
```

Минимальный DTO — только ID и имя тега. Используется везде, где нужно передать тег клиенту: в `PostSummaryResponse.tags`, в результатах поиска тегов, в недавних тегах.
