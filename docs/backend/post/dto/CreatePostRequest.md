# CreatePostRequest, UpdatePostRequest

## Назначение

DTO для создания и обновления поста. `CreatePostRequest` — все обязательные поля плюс теги. `UpdatePostRequest` — те же поля, но все необязательные (частичное обновление).

## Полный разбор кода

### CreatePostRequest

```java
public record CreatePostRequest(
        @NotBlank @Size(max = 120) String title,
        @NotBlank @Size(max = 120) String author,
        @NotBlank String description,
        List<String> tagNames,
        List<Long> tagIds
) {}
```

**`@NotBlank`**
Bean Validation — поле не может быть `null`, пустой строкой или строкой из пробелов. Отличие от `@NotNull`: `@NotNull` допускает пустую строку `""`, `@NotBlank` — нет.

**`@Size(max = 120)`**
Ограничение длины строки. Соответствует ограничению `@Column(length = 120)` в сущности `Post`.

**`List<String> tagNames` + `List<Long> tagIds`**
Теги можно передать двумя способами: по имени (строка) или по ID. Оба поля необязательны (`null` допустим). В сервисе `resolveTags()` объединяет оба списка в `Set<Tag>`.

---

### UpdatePostRequest

```java
public record UpdatePostRequest(
        @Size(max = 120) String title,
        @Size(max = 120) String author,
        String description,
        List<String> tagNames,
        List<Long> tagIds,
        Boolean removeImage
) {}
```

**Нет `@NotBlank`**
При обновлении все поля необязательны — клиент передаёт только то, что хочет изменить. В сервисе каждое поле проверяется: `if (req.title() != null) post.setTitle(req.title())`.

**`Boolean removeImage` (не `boolean`)**
Объектный тип `Boolean` (а не примитив `boolean`) позволяет передать `null` — "не менять". `true` — удалить текущее изображение. `false` или `null` — оставить как есть.
