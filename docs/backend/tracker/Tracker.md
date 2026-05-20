# Tracker: TrackerEntry, TrackerController, TrackerService, TrackerRepository

## Назначение

Трекер чтения — позволяет пользователю фиксировать количество прочитанных страниц за каждый день. Данные хранятся по схеме `(userId, date) → pagesRead`. Поддерживает просмотр по месяцу, upsert (создание или обновление), удаление записи, сводку по месяцу.

## Полный разбор кода

### TrackerEntry

```java
@Entity
@Table(name = "reading_tracker")
public class TrackerEntry {

    @EmbeddedId
    private TrackerEntryId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "pages_read")
    private Integer pagesRead;

    @Embeddable
    @EqualsAndHashCode
    public static class TrackerEntryId implements Serializable {
        @Column(name = "user_id") private Long userId;
        @Column(name = "date")    private LocalDate date;
    }
}
```

**Составной ключ `(userId, date)`**
Один пользователь может иметь только одну запись на одну дату. Это гарантируется на уровне БД (PRIMARY KEY). Операция upsert работает через `findById(id)` — если запись есть, обновляем; если нет — создаём.

**`LocalDate date`**
Java-тип для даты без времени (только год/месяц/день). JPA маппирует на SQL тип `DATE`. Это правильный выбор для трекера — время чтения не важно, только день.

---

### TrackerController

```java
@RestController
public class TrackerController {

    @GetMapping("/api/tracker")
    public List<TrackerEntryResponse> getMonth(
            @RequestParam String month,
            @AuthenticationPrincipal String email) {
        YearMonth yearMonth = YearMonth.parse(month);  // "2025-01"
        return trackerService.getMonth(currentUserResolver.resolve(email), yearMonth);
    }

    @PutMapping("/api/tracker/{date}")
    public TrackerEntryResponse upsert(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestBody UpsertTrackerEntryRequest request,
            @AuthenticationPrincipal String email) {
        return trackerService.upsert(currentUserResolver.resolve(email), date, request.pagesRead());
    }

    @GetMapping("/api/users/{nickname}/tracker/monthly-summary")
    public MonthlyPagesResponse getMonthlyTotal(
            @PathVariable String nickname,
            @RequestParam(required = false) String month) {
        YearMonth yearMonth = month != null ? YearMonth.parse(month) : YearMonth.now();
        ...
    }

    @DeleteMapping("/api/tracker/{date}")
    public void delete(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal String email) { ... }
}
```

**`YearMonth.parse(month)`**
`YearMonth` — Java-тип для года и месяца без конкретного дня (например, `"2025-01"` → январь 2025). Используется для фильтрации записей по месяцу.

**`@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)`**
Говорит Spring, как парсить дату из URL-параметра. `ISO.DATE` = формат `YYYY-MM-DD`. Без этой аннотации Spring не знает, что `"2025-01-15"` в пути `/api/tracker/2025-01-15` нужно разобрать как `LocalDate`.

**`@PutMapping` для upsert**
`PUT` (а не `POST`) семантически означает «установить значение для ресурса». Это подходит для upsert: создать или обновить запись для конкретной даты.

**`YearMonth.now()`**
Если параметр `month` не передан в сводке по месяцу — возвращается текущий месяц.

---

### TrackerService

```java
@Transactional
public TrackerEntryResponse upsert(User user, LocalDate date, Integer pagesRead) {
    TrackerEntry.TrackerEntryId id = new TrackerEntry.TrackerEntryId(user.getUserId(), date);
    TrackerEntry entry = trackerRepository.findById(id)
            .orElseGet(() -> TrackerEntry.builder().id(id).user(user).build());
    entry.setPagesRead(pagesRead);
    trackerRepository.save(entry);
    return new TrackerEntryResponse(date, pagesRead);
}
```

**Паттерн upsert через `findById` + `orElseGet`**
Ищем запись по составному ключу. Если нашли — это существующая сущность в Hibernate, `setPagesRead()` отметит её как изменённую, `save()` выполнит UPDATE. Если не нашли — `orElseGet` создаёт новую, `save()` выполнит INSERT.

---

### TrackerRepository

```java
@Query("""
        SELECT t FROM TrackerEntry t
        WHERE t.id.userId = :userId
          AND YEAR(t.id.date) = :year
          AND MONTH(t.id.date) = :month
        ORDER BY t.id.date ASC
        """)
List<TrackerEntry> findByUserIdAndYearMonth(
        @Param("userId") Long userId,
        @Param("year") int year,
        @Param("month") int month);

@Query("SELECT COALESCE(SUM(t.pagesRead), 0) FROM TrackerEntry t WHERE ...")
long sumPagesByUserIdAndYearMonth(...);
```

**`YEAR(t.id.date)` / `MONTH(t.id.date)`**
JPQL-функции для извлечения года и месяца из даты. JPA транслирует их в соответствующие SQL-функции (`EXTRACT(YEAR FROM date)` и т.д.).

**`t.id.userId` / `t.id.date`**
Навигация по составному ключу через точечную нотацию в JPQL.

**`COALESCE(SUM(...), 0)`**
`SUM()` на пустой выборке возвращает `NULL`. `COALESCE(NULL, 0) = 0`. Без этого метод вернул бы `null` при несовпадении ни одной записи → `NullPointerException` при распаковке в `long`.
