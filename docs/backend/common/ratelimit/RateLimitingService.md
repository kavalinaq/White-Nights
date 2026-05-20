# RateLimitingService

## Назначение

Сервис ограничения частоты запросов (rate limiting). Реализует алгоритм «token bucket» через библиотеку Bucket4j. Каждый уникальный ключ (IP-адрес или email) получает свою «корзину» с токенами — максимум 5 запросов в минуту.

## Полный разбор кода

```java
@Service
public class RateLimitingService {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public Bucket resolveBucket(String key) {
        return buckets.computeIfAbsent(key, this::newBucket);
    }

    public void clearBuckets() {
        buckets.clear();
    }

    private Bucket newBucket(String key) {
        return Bucket.builder()
                .addLimit(Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(1))))
                .build();
    }
}
```

### Построчный разбор

**`private final Map<String, Bucket> buckets = new ConcurrentHashMap<>()`**
Хранит корзины в памяти — для каждого ключа (IP или email) своя корзина. `ConcurrentHashMap` — потокобезопасный словарь: несколько потоков (запросов) могут обращаться к нему одновременно без конфликтов. Обычный `HashMap` не потокобезопасен.

**`buckets.computeIfAbsent(key, this::newBucket)`**
Атомарная операция: если корзины для ключа нет — создаёт новую (`newBucket`), если есть — возвращает существующую. `this::newBucket` — ссылка на метод, используется как функция создания корзины.

**Алгоритм «token bucket» (корзина с токенами):**
Представьте корзину, в которой максимум 5 токенов. При каждом запросе тратится 1 токен. Каждую минуту корзина пополняется 5 токенами. Если корзина пуста — запрос отклоняется (HTTP 429).

**`Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(1)))`**
- `5` — ёмкость корзины (максимум токенов)
- `Refill.intervally(5, Duration.ofMinutes(1))` — пополнять 5 токенов каждую минуту целиком (не постепенно). То есть: первые 5 запросов за минуту проходят, следующие отклоняются, через минуту снова 5 запросов.

**`public void clearBuckets()`**
Очищает все корзины. Вызывается в тестах (`@BeforeEach`) — каждый тест начинается с чистого состояния, без накопленных лимитов.

**Как используется в `AuthController`:**
```java
if (!rateLimitingService.resolveBucket("ip:" + ipAddress).tryConsume(1)) {
    throw new TooManyRequestsException("Too many requests");
}
```
`tryConsume(1)` — пытается потратить 1 токен. Возвращает `true` (запрос разрешён) или `false` (токены кончились).
