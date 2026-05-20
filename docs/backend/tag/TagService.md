# TagService

## Назначение

Сервис для работы с тегами. Реализует поиск по префиксу, получение недавних/популярных тегов для пользователя и создание тега, если он не существует.

## Полный разбор кода

```java
@Service
@RequiredArgsConstructor
public class TagService {

    public List<Tag> search(String query, int limit) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return tagRepository.searchByPrefix(query.trim(), PageRequest.of(0, limit));
    }

    public List<Tag> recent(Long userId, int limit) {
        List<Tag> userRecent = tagRepository.findRecentByUser(userId, limit);
        if (userRecent.size() >= limit) {
            return userRecent;
        }
        List<Long> alreadyIncluded = userRecent.stream().map(Tag::getTagId).toList();
        List<Tag> popular = tagRepository.findGlobalPopular(limit).stream()
                .filter(t -> !alreadyIncluded.contains(t.getTagId()))
                .limit(limit - userRecent.size())
                .toList();
        return merge(userRecent, popular);
    }

    @Transactional
    public Tag findOrCreate(String name) {
        return tagRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> tagRepository.save(Tag.builder().name(name.toLowerCase()).build()));
    }

    private List<Tag> merge(List<Tag> a, List<Tag> b) {
        return java.util.stream.Stream.concat(a.stream(), b.stream()).toList();
    }
}
```

### Построчный разбор

**`query.trim()`**
Удаляет пробелы в начале и конце строки перед передачей в репозиторий. Предотвращает поиск по строке `"  фант  "` с лишними пробелами.

**`recent()` — двухшаговое формирование списка**
1. Берём недавние теги пользователя (теги из его последних постов)
2. Если их меньше, чем `limit`, дополняем глобально популярными тегами
3. Исключаем из популярных те, которые уже есть в недавних (`!alreadyIncluded.contains(...)`)

**`userRecent.stream().map(Tag::getTagId).toList()`**
Собирает ID уже добавленных тегов. Используется для фильтрации популярных тегов-дублей.

**`limit(limit - userRecent.size())`**
Берёт ровно столько популярных тегов, сколько не хватает до `limit`. Например: нужно 10, нашли 3 недавних → берём 7 популярных.

**`findOrCreate(String name)` + `@Transactional`**
Ищет тег по имени без учёта регистра. Если не найден — создаёт новый с именем в нижнем регистре. `@Transactional` гарантирует, что поиск и создание выполняются в одной транзакции — защита от гонки потоков (хотя уникальный индекс в БД дополнительно защищает).

**`orElseGet(() -> tagRepository.save(...))`**
`orElseGet` принимает `Supplier` — лямбду, которая вызывается только если `Optional` пуст. Если тег найден, `save()` не вызывается. Это отличие от `orElse(tagRepository.save(...))`, где `save()` вызвался бы всегда.

**`Stream.concat(a.stream(), b.stream()).toList()`**
Объединяет два списка через Stream API. `Stream.concat` создаёт поток, где сначала идут элементы потока `a`, потом `b`.
