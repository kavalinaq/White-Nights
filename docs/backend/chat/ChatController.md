# ChatController

## Назначение

REST-контроллер чатов. Управляет чатами (создание, удаление, список), участниками (добавление, удаление, список), историей сообщений, загрузкой изображений и удалением сообщений. Удаление и загрузка изображений также рассылают обновления через WebSocket.

## Полный разбор кода

```java
@RestController
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/api/chats")
    public List<ChatResponse> getChats(@AuthenticationPrincipal String email) {
        return chatService.getChats(currentUserResolver.resolve(email));
    }

    @PostMapping("/api/chats")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatResponse createChat(@RequestBody CreateChatRequest request, ...) {
        return chatService.createChat(request.peerId(), request.name(), request.memberIds(), ...);
    }

    @GetMapping("/api/chats/{id}/messages")
    public List<MessageResponse> getMessages(
            @PathVariable Long id,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "50") int limit, ...) {
        return chatService.getMessages(id, cursor, limit, ...);
    }

    @PostMapping("/api/chats/{id}/upload-image")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file, ...) {
        MessageResponse response = chatService.saveImageMessage(id, file, user);
        messagingTemplate.convertAndSend("/topic/chat/" + id, response);
        return response;
    }

    @DeleteMapping("/api/messages/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMessage(@PathVariable Long id, ...) {
        MessageResponse updated = chatService.deleteMessage(id, ...);
        messagingTemplate.convertAndSend("/topic/chat/" + updated.chatId(), updated);
    }
}
```

### Построчный разбор

**`SimpMessagingTemplate messagingTemplate`**
Инструмент для отправки сообщений в WebSocket-брокер из HTTP-контроллера. Используется когда REST-операция должна уведомить подписчиков WebSocket.

**`uploadImage` — REST + WebSocket**
Изображение загружается через REST (multipart), а не через WebSocket (нет поддержки бинарных данных в STOMP текстовом протоколе). После загрузки результат рассылается через WebSocket — все участники чата получают новое сообщение.

**`deleteMessage` — обновление через WebSocket**
При удалении сообщения через REST — рассылается обновлённый `MessageResponse` с `isDeleted: true`. Клиенты, открывшие этот чат, получат обновление и перерисуют сообщение.

**`@RequestParam("file") MultipartFile file`**
Файл передаётся как часть `multipart/form-data` запроса. `@RequestParam("file")` указывает имя поля формы.

**`CreateChatRequest` — универсальный запрос**
Один DTO для двух сценариев: если `peerId != null` — личный чат, если `name != null` + `memberIds` — групповой. Логика выбора в `ChatService.createChat`.
