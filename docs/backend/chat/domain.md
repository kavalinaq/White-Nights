# Chat Domain: Chat, ChatMember, ChatMemberRole, Message

## Назначение

Четыре сущности для системы чатов. `Chat` — сам чат (личный или групповой). `ChatMember` — участник чата с составным ключом и ролью. `Message` — сообщение с поддержкой текста и изображений, и мягким удалением. `ChatMemberRole` — перечисление ролей.

## Полный разбор кода

### Chat

```java
@Entity
@Table(name = "chats")
public class Chat {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long chatId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(length = 100)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private boolean isGroup = false;

    @Column(length = 255)
    private String avatarUrl;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

**`String name`**
Имя чата — только для групповых чатов. Для личных чатов `name = null`, а имя отображается как никнейм собеседника (вычисляется в `toChatResponse`).

**`boolean isGroup`**
Флаг типа чата. Личные чаты: `isGroup = false`, участников ровно 2. Групповые: `isGroup = true`, участников может быть много.

---

### ChatMember

```java
@Entity
@Table(name = "chat_members")
public class ChatMember {

    @EmbeddedId
    private ChatMemberId id;

    @ManyToOne(fetch = FetchType.LAZY) @MapsId("chatId") @JoinColumn(name = "chat_id")
    private Chat chat;

    @ManyToOne(fetch = FetchType.LAZY) @MapsId("userId") @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "chat_member_role")
    @Builder.Default
    private ChatMemberRole role = ChatMemberRole.member;

    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @Embeddable @EqualsAndHashCode
    public static class ChatMemberId implements Serializable {
        @Column(name = "chat_id") private Long chatId;
        @Column(name = "user_id") private Long userId;
    }
}
```

**Составной ключ `(chatId, userId)`**
Пользователь может быть в одном чате только один раз. Попытка добавить дважды нарушила бы уникальность ключа.

**`columnDefinition = "chat_member_role"`**
PostgreSQL enum-тип. Без этого JPA попробовал бы хранить как VARCHAR, но в схеме определён пользовательский тип. `columnDefinition` задаёт имя SQL-типа напрямую.

---

### Message

```java
@Entity
@Table(name = "messages")
public class Message {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long messageId;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "chat_id") private Chat chat;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "sender_id") private User sender;

    @Column(columnDefinition = "TEXT") private String text;
    @Column(name = "image_url")        private String imageUrl;

    @Column(nullable = false)
    @Builder.Default
    private boolean isDeleted = false;

    @CreationTimestamp
    @Column(name = "sent_at", nullable = false, updatable = false)
    private LocalDateTime sentAt;
}
```

**Либо `text`, либо `imageUrl` — оба могут быть `null`**
Сообщение может быть текстовым (заполнен `text`) или с картинкой (заполнен `imageUrl`). Оба поля не обязательны — в теории могут существовать пустые сообщения, но логика сервиса этого не допускает.

**`boolean isDeleted` — мягкое удаление**
При удалении сообщения флаг устанавливается в `true`, запись остаётся в БД. В `toMessageResponse`: `m.isDeleted() ? null : m.getText()` — клиент получает `null` вместо текста и знает, что показать «Сообщение удалено».

---

### ChatMemberRole

```java
public enum ChatMemberRole {
    member,
    owner
}
```

`owner` — создатель группового чата. Может добавлять/удалять участников и менять аватар. `member` — обычный участник.
