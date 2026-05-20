# SearchService, SearchResponse, UserSearchResult

## Назначение

Сервис поиска — выполняет запросы к трём репозиториям (пользователи, посты, теги) и преобразует результаты в DTO. `SearchResponse` — сводный результат поиска. `UserSearchResult` — DTO пользователя в результатах поиска.

## Полный разбор кода

### SearchService

```java
@Service
@RequiredArgsConstructor
public class SearchService {

    private static final int GROUPED_LIMIT = 5;
    private static final int MAX_PAGE_SIZE = 50;

    @Transactional(readOnly = true)
    public SearchResponse search(String q, int limit) {
        int cap = Math.min(limit, GROUPED_LIMIT);
        PageRequest page = PageRequest.of(0, cap);

        List<UserSearchResult> users = userRepository
                .searchByNickname(q, null, page)
                .stream()
                .map(this::toUserResult)
                .toList();

        List<PostSummaryResponse> posts = postRepository
                .searchPosts(q, null, page)
                .stream()
                .map(p -> postService.toSummary(p, false, false))
                .toList();

        List<TagResponse> tags = tagRepository
                .searchByName(q, null, page)
                .stream()
                .map(t -> new TagResponse(t.getTagId(), t.getName()))
                .toList();

        return new SearchResponse(users, posts, tags);
    }

    private UserSearchResult toUserResult(User u) {
        return new UserSearchResult(u.getUserId(), u.getNickname(), u.getAvatarUrl(), u.isPrivate());
    }
}
```

**`private static final int GROUPED_LIMIT = 5`**
Константа для сводного поиска — не магическое число `5` прямо в коде, а именованная константа. `static final` — значение одно на весь класс, не меняется.

**`Math.min(limit, GROUPED_LIMIT)`**
Даже если клиент передал `limit=100`, для сводного поиска возвращается максимум 5 результатов каждого типа. Это сознательное ограничение для быстрого preview-поиска.

**`cursor = null`**
Для сводного поиска пагинация не нужна — показываются первые результаты. `null` означает «начать сначала».

**`this::toUserResult`**
Ссылка на метод экземпляра. Эквивалентно лямбде `u -> this.toUserResult(u)`. Используется для того, чтобы маппинг `User → UserSearchResult` был в одном месте.

**`postService.toSummary(p, false, false)`**
Флаги `liked = false`, `saved = false` — для поиска не вычисляется, лайкал ли текущий пользователь пост. Компромисс ради упрощения.

---

### SearchResponse

```java
public record SearchResponse(
        List<UserSearchResult> users,
        List<PostSummaryResponse> posts,
        List<TagResponse> tags
) {}
```

Сводный результат поиска. Один объект содержит результаты по всем трём типам — клиент отображает их в разных секциях страницы поиска.

---

### UserSearchResult

```java
public record UserSearchResult(Long userId, String nickname, String avatarUrl, boolean isPrivate) {}
```

**`boolean isPrivate`**
Показывается в результатах поиска, чтобы клиент мог отобразить иконку закрытого аккаунта. Пользователь знает, что при переходе в профиль посты могут быть скрыты.
