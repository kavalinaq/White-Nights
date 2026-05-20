# Support: SupportMessage, SupportController, SupportService

## Назначение

Система обращений в поддержку. Пользователи отправляют сообщения (`subject` + `message`). Администраторы просматривают все обращения и отвечают на них. Статус обращения: `open` → `resolved` после ответа.

## Полный разбор кода

### SupportMessage

```java
@Entity @Table(name = "support_messages")
public class SupportMessage {

    @Id @GeneratedValue private Long supportMessageId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 200) private String subject;
    @Column(nullable = false, columnDefinition = "TEXT") private String message;

    @Column(columnDefinition = "TEXT") private String response;
    @Column(name = "responded_at") private LocalDateTime respondedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responded_by")
    private User respondedBy;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SupportStatus status = SupportStatus.open;
}
```

**`optional = false` в `@ManyToOne`**
Гарантирует, что поле `user` не может быть `null` при создании сущности. Это строже, чем просто `nullable = false` на колонке — Hibernate тоже учитывает это при генерации запросов.

**`response` + `respondedAt` + `respondedBy`**
Три поля для ответа. Заполняются только после ответа администратора — до этого `null`. Позволяет отобразить: «Ответил admin_nick 15 мая в 14:30: [текст ответа]».

---

### API

**`POST /api/support/messages`** — отправить обращение (любой пользователь)

**`GET /api/support/messages/me`** — мои обращения и ответы на них

**`GET /api/admin/support/messages`** — все обращения (только admin)

**`POST /api/admin/support/messages/{id}/reply`** — ответить на обращение (только admin)

---

### SupportService

**`reply()` — ответ на обращение**
```java
msg.setResponse(response);
msg.setRespondedAt(LocalDateTime.now());
msg.setRespondedBy(admin);
msg.setStatus(SupportStatus.resolved);
```

Устанавливает все четыре поля за одну операцию и меняет статус на `resolved`. `LocalDateTime.now()` — текущее время в часовом поясе сервера.

**`@PreAuthorize("hasRole('ADMIN')")`**
`listAll` и `reply` доступны только администраторам. Метод `submit` открыт для всех аутентифицированных пользователей.

### SupportStatus enum

```
open → resolved
```

Простой двухшаговый lifecycle: открытое обращение ждёт ответа; после ответа становится разрешённым.
