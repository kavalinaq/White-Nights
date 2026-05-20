# ChatService

## Назначение

Сервис чатов. Управляет созданием (личный/групповой), получением списка чатов, историей сообщений, участниками, загрузкой изображений в MinIO, мягким удалением сообщений.

## Ключевые паттерны

### Получение списка чатов с оптимизацией

```java
public List<ChatResponse> getChats(User user) {
    List<Chat> chats = chatRepository.findByMember(user.getUserId());
    if (chats.isEmpty()) return List.of();

    List<Long> chatIds = chats.stream().map(Chat::getChatId).toList();
    Map<Long, List<ChatMember>> membersByChat = chatMemberRepository
            .findByChatIdInFetchUser(chatIds).stream()
            .collect(Collectors.groupingBy(m -> m.getId().getChatId()));
    Map<Long, Message> latestByChat = messageRepository
            .findLatestMessagesByChatIdIn(chatIds).stream()
            .collect(Collectors.toMap(m -> m.getChat().getChatId(), m -> m));

    return chats.stream()
            .map(c -> toChatResponse(c, user,
                    membersByChat.getOrDefault(c.getChatId(), List.of()),
                    latestByChat.get(c.getChatId())))
            .toList();
}
```

**Batch-запросы**
Вместо загрузки членов и последнего сообщения для каждого чата отдельно, делается 2 запроса на все чаты сразу. `Collectors.groupingBy(...)` группирует участников по `chatId` в `Map<Long, List<ChatMember>>`. `Collectors.toMap(...)` строит `Map<Long, Message>` — последнее сообщение для каждого чата.

---

### Создание чата

```java
public ChatResponse createChat(Long peerId, String name, List<Long> memberIds, User creator) {
    if (peerId != null) {
        return chatRepository.findExisting1v1(creator.getUserId(), peerId)
                .map(c -> toChatResponse(c, creator))
                .orElseGet(() -> create1v1(peerId, creator));
    }
    return createGroup(name, memberIds, creator);
}
```

**Идемпотентность личного чата**
Если чат между двумя пользователями уже существует — возвращается существующий. Иначе создаётся новый. `findExisting1v1` ищет чат, где оба пользователя являются участниками.

---

### Имя чата для личных чатов

```java
String displayName = chat.isGroup() ? chat.getName()
        : members.stream()
        .filter(m -> !m.getId().getUserId().equals(viewer.getUserId()))
        .findFirst()
        .map(m -> m.getUser().getNickname())
        .orElse("Unknown");
```

Для личных чатов имя не хранится в БД — вычисляется как никнейм **другого** участника (не текущего пользователя).

---

### Загрузка изображений в чат

```java
public MessageResponse saveImageMessage(Long chatId, MultipartFile file, User sender) {
    String contentType = file.getContentType();
    if (contentType == null || !contentType.startsWith("image/")) {
        throw new BadRequestException("Only image files are allowed");
    }
    String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
    String imageUrl = storageService.uploadFile(chatBucket, filename, file);
    Message message = messageRepository.save(Message.builder()
            .chat(chat).sender(sender).imageUrl(imageUrl).build());
    return toMessageResponse(message);
}
```

`UUID.randomUUID()` в имени файла предотвращает коллизии — два файла с одинаковым именем не перезапишут друг друга.

---

### Мягкое удаление сообщения

```java
public MessageResponse deleteMessage(Long messageId, User user) {
    message.setDeleted(true);
    messageRepository.save(message);
    return toMessageResponse(message);
}

// В toMessageResponse:
m.isDeleted() ? null : m.getText()
m.isDeleted() ? null : m.getImageUrl()
```

Сообщение не удаляется из БД — только помечается флагом. Текст и URL изображения заменяются на `null`. Клиент видит `isDeleted: true` и показывает «Сообщение удалено».

---

### Проверки прав доступа

```java
private void requireMember(Long chatId, User user) {
    if (!chatMemberRepository.existsByIdChatIdAndIdUserId(chatId, user.getUserId())) {
        throw new ForbiddenException("Not a member of this chat");
    }
}

private void requireOwner(Long chatId, User user) {
    ChatMember member = chatMemberRepository.findById(...)...;
    if (member.getRole() != ChatMemberRole.owner) {
        throw new ForbiddenException("Only the owner can perform this action");
    }
}
```

`requireMember` — только участники могут читать сообщения и историю. `requireOwner` — только владелец может добавлять/удалять участников.
