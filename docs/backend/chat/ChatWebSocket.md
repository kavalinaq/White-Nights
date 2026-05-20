# WebSocket: WebSocketConfig, WebSocketAuthInterceptor, ChatWebSocketController, PresenceService

## Назначение

Четыре класса для WebSocket-чата. `WebSocketConfig` настраивает STOMP-брокер. `WebSocketAuthInterceptor` аутентифицирует соединение через JWT. `ChatWebSocketController` принимает сообщения и рассылает их участникам. `PresenceService` отслеживает онлайн-статус пользователей.

## Полный разбор кода

### WebSocketConfig

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/user");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authInterceptor);
    }

    @EventListener
    public void onConnect(SessionConnectedEvent event) {
        String email = (String) auth.getPrincipal();
        presenceService.userConnected(userId);
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        presenceService.userDisconnected(userId);
    }
}
```

**`enableSimpleBroker("/topic", "/user")`**
Включает встроенный in-memory брокер сообщений. `/topic` — рассылка группе (чат-комнаты). `/user` — персональные сообщения конкретному пользователю.

**`setApplicationDestinationPrefixes("/app")`**
Все сообщения от клиента с префиксом `/app` направляются в `@MessageMapping`-контроллеры. Сообщение `client.send("/app/chat/5", ...)` попадёт в метод с `@MessageMapping("/chat/{chatId}")`.

**`setUserDestinationPrefix("/user")`**
Позволяет отправлять сообщения конкретному пользователю через `convertAndSendToUser(email, "/queue/messages", payload)`. Клиент подписывается на `/user/queue/messages`.

**`.withSockJS()`**
SockJS — библиотека-полифилл для браузеров без WebSocket. Автоматически откатывается на long-polling и другие транспорты. URL подключения в браузере: `/ws` + `?transport=websocket`.

**`@EventListener` onConnect/onDisconnect**
Spring автоматически вызывает эти методы при подключении/отключении WebSocket-сессии. Обновляет `PresenceService`.

---

### WebSocketAuthInterceptor

```java
@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() != StompCommand.CONNECT) {
            return message;
        }

        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        String token = authHeaders.get(0);
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
            String email = jwtService.extractEmail(token);
            accessor.setUser(new UsernamePasswordAuthenticationToken(email, null, emptyList()));
        }
        return message;
    }
}
```

**`ChannelInterceptor.preSend`**
Метод вызывается перед каждым сообщением в канале. Это WebSocket-аналог HTTP-фильтра `JwtAuthenticationFilter`.

**`accessor.getCommand() != StompCommand.CONNECT`**
JWT проверяется только при первом STOMP-фрейме `CONNECT`. Все последующие сообщения уже привязаны к аутентифицированной сессии.

**`accessor.getNativeHeader("Authorization")`**
STOMP-заголовки — это не HTTP-заголовки. Клиент передаёт `Authorization: Bearer <token>` в заголовках STOMP CONNECT-фрейма, не в HTTP.

**`accessor.setUser(auth)`**
Устанавливает аутентифицированного пользователя для STOMP-сессии. После этого `Principal principal` в `@MessageMapping`-методах содержит email пользователя.

---

### ChatWebSocketController

```java
@Controller
public class ChatWebSocketController {

    @MessageMapping("/chat/{chatId}")
    public void sendMessage(
            @DestinationVariable Long chatId,
            @Payload String text,
            Principal principal) {
        User sender = currentUserResolver.resolve(principal.getName());
        MessageResponse response = chatService.saveAndBuildResponse(chatId, text, sender);
        messagingTemplate.convertAndSend("/topic/chat/" + chatId, response);
    }
}
```

**`@MessageMapping("/chat/{chatId}")`**
Клиент отправляет на `/app/chat/5`, `/app` отрезается конфигурацией, обрабатывается метод с `@MessageMapping("/chat/{chatId}")`.

**`@DestinationVariable Long chatId`**
Аналог `@PathVariable` для WebSocket — извлекает `chatId` из пути назначения.

**`@Payload String text`**
Тело STOMP-сообщения.

**`Principal principal`**
Аутентифицированный пользователь из сессии (установлен `WebSocketAuthInterceptor`). `principal.getName()` = email.

**`messagingTemplate.convertAndSend("/topic/chat/" + chatId, response)`**
Рассылает сообщение всем, кто подписан на `/topic/chat/5`. Клиент подписывается: `stomp.subscribe("/topic/chat/" + chatId, ...)`.

---

### PresenceService

```java
@Service
public class PresenceService {

    private final Set<Long> onlineUsers = Collections.newSetFromMap(new ConcurrentHashMap<>());

    public void userConnected(Long userId) { onlineUsers.add(userId); }
    public void userDisconnected(Long userId) { onlineUsers.remove(userId); }
    public boolean isOnline(Long userId) { return onlineUsers.contains(userId); }
}
```

**`Collections.newSetFromMap(new ConcurrentHashMap<>())`**
Java не имеет встроенного `ConcurrentHashSet`. `newSetFromMap` создаёт `Set`, делегирующий операции в `ConcurrentHashMap`. Потокобезопасность важна — WebSocket-соединения могут открываться/закрываться из разных потоков.

**In-memory хранилище**
Онлайн-статусы хранятся только в памяти. При перезапуске сервера все пользователи становятся «офлайн». Это нормально — WebSocket-соединения тоже разрываются при перезапуске.
