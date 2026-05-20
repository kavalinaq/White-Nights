# Moderation: Report, ModerationAction, ReportController, ModerationController, ReportService, ModerationService

## Назначение

Система модерации. Пользователи создают жалобы (`Report`) на посты, комментарии или пользователей. Модераторы просматривают очередь жалоб, берут их в работу (`claim`) и разрешают (`resolve`) — применяя блокировку поста, бан пользователя или предупреждение. Каждое действие записывается в `ModerationAction`.

## Домен

### Report

```java
@Entity @Table(name = "reports")
public class Report {
    @Id @GeneratedValue private Long reportId;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "reporter_id")
    private User reporter;

    @Enumerated(EnumType.STRING) @Column(columnDefinition = "report_target_type")
    private ReportTargetType targetType;  // user | post | comment

    @Column(name = "target_id")
    private Long targetId;

    @Column(length = 1000)
    private String reason;

    @Enumerated(EnumType.STRING) @Column(columnDefinition = "report_status")
    @Builder.Default
    private ReportStatus status = ReportStatus.pending;  // pending | in_review | resolved
}
```

**`targetType` + `targetId` — полиморфная ссылка**
Вместо трёх отдельных FK (`postId`, `userId`, `commentId`) используется универсальная пара: тип цели + ID. Это гибче, но теряется referential integrity на уровне БД.

### ModerationAction

Аудит-лог действий модератора. Хранит: ссылку на жалобу, модератора, тип действия и комментарий.

## API

**`POST /api/reports`** — подать жалобу (для всех пользователей)

**`GET /api/reports/me`** — свои жалобы

**`GET /api/moderation/reports`** — очередь жалоб (только модераторы/администраторы)

**`POST /api/moderation/reports/{id}/claim`** — взять жалобу в работу (меняет статус `pending → in_review`)

**`POST /api/moderation/reports/{id}/resolve`** — разрешить жалобу (меняет статус `→ resolved`, применяет действие)

## Ключевые паттерны

### `@PreAuthorize` вместо SecurityConfig

```java
@PreAuthorize("hasAnyRole('MODERATOR','ADMIN')")
public List<ReportResponse> getQueue(...) { ... }
```

`@PreAuthorize` — аннотация метода, требующая наличие роли. Работает через Spring AOP — перед вызовом метода Spring проверяет роль. Включается аннотацией `@EnableMethodSecurity` в `SecurityConfig`.

### Идемпотентность жалоб

```java
boolean duplicate = reportRepository.existsByReporter_UserIdAndTargetTypeAndTargetIdAndStatus(
        reporter.getUserId(), request.targetType(), request.targetId(), ReportStatus.pending);
if (duplicate) {
    throw new ConflictException("You already have a pending report for this target");
}
```

Нельзя подать две одинаковые жалобы на один объект. Проверяется по комбинации `(reporter, targetType, targetId, status=pending)`.

### `applyAction` — применение действия при разрешении

```java
private void applyAction(Report report, ModerationActionType action) {
    switch (action) {
        case block_post -> { post.setBlocked(true); postRepository.save(post); }
        case ban_user -> {
            user.setBlocked(true);
            userRepository.save(user);
            refreshTokenRepository.deleteByUser(user);  // принудительный выход
        }
        case warn_user, reject -> { /* заглушка */ }
    }
}
```

**`refreshTokenRepository.deleteByUser(user)` при бане**
Удаление токенов обновления → при следующей попытке рефреша пользователь получит ошибку и будет разлогинен. Немедленный принудительный выход заблокированного пользователя.

### Batch-обогащение ответов

В `toResponses()` все жалобы обрабатываются за 3 запроса (пользователи, посты, комментарии), а не по одному запросу на каждую жалобу.

## Enums

- `ReportTargetType`: `user`, `post`, `comment`
- `ReportStatus`: `pending`, `in_review`, `resolved`
- `ModerationActionType`: `block_post`, `ban_user`, `warn_user`, `reject`
