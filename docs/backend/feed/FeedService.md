# FeedService

## Назначение

Сервис формирования ленты. Тонкая обёртка над `PostRepository.findFeedPosts` — делегирует запрос в репозиторий, ограничивает размер страницы и задаёт статус подписки `accepted`.

## Полный разбор кода

```java
@Service
@RequiredArgsConstructor
public class FeedService {

    private final PostRepository postRepository;

    @Transactional(readOnly = true)
    public List<Post> getFeed(User viewer, Long cursor, int limit) {
        return postRepository.findFeedPosts(
                viewer,
                FollowStatus.accepted,
                cursor,
                PageRequest.of(0, Math.min(limit, 50))
        );
    }
}
```

### Построчный разбор

**`@Transactional(readOnly = true)`**
Открывает транзакцию только для чтения. Это подсказка для базы данных, что изменений не будет — позволяет оптимизировать выполнение запроса (например, отключить flush-кэша Hibernate).

**`FollowStatus.accepted`**
Лента показывает посты только от **принятых** подписок. Запрос со статусом `pending` не показывается — пользователь ещё не принял запрос на подписку.

**`Math.min(limit, 50)`**
Защита от злоупотреблений: клиент не может запросить больше 50 постов за раз, даже если передаст `limit=10000`.

**`PageRequest.of(0, Math.min(limit, 50))`**
Страница 0 (первая), размер ограничен. `PageRequest` реализует `Pageable` — добавляет LIMIT к JPQL-запросу.

**Архитектура ленты — read-time**
Лента вычисляется в момент запроса через подзапрос в `findFeedPosts`. Альтернатива — fan-out on write (при публикации поста записывать его в ленту каждого подписчика). Read-time проще, но медленнее при большом числе подписок. Fan-out быстрее для чтения, но требует дополнительной таблицы и сложной логики.
