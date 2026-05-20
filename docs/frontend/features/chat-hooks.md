# features/chat/hooks: useChatSocket, useChats, useMessages

## Назначение

Три хука для чата. `useChatSocket` управляет WebSocket-соединением. `useChats` получает список чатов и мутации (создание, удаление). `useMessages` — история сообщений с cursor-based пагинацией.

## Полный разбор кода

### useChatSocket.ts

```typescript
export function useChatSocket(chatId: number | undefined, onMessage: (msg: ChatMessage) => void) {
  const clientRef = useRef<Client | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!chatId) return;
    const token = localStorage.getItem('access_token');
    const stomp = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        stomp.subscribe(`/topic/chat/${chatId}`, (frame: IMessage) => {
          const msg = JSON.parse(frame.body) as ChatMessage;
          onMessageRef.current(msg);
        });
      },
    });
    stomp.activate();

    return () => {
      stomp.deactivate();
      clientRef.current = null;
    };
  }, [chatId]);

  const sendMessage = (text: string) => {
    clientRef.current?.publish({
      destination: `/app/chat/${chatId}`,
      body: text,
    });
  };

  return { connected, sendMessage };
}
```

**`useRef<Client | null>(null)` для STOMP-клиента**
Ref, а не state — потому что изменение STOMP-клиента не должно вызывать ре-рендер.

**`onMessageRef.current = onMessage`**
Стабилизация callback через ref: если `onMessage` меняется (создаётся новая функция при каждом рендере родителя), не пересоздаём WebSocket-соединение. `onMessageRef` всегда содержит актуальную версию callback.

**`webSocketFactory: () => new SockJS(WS_URL)`**
`@stomp/stompjs` использует WebSocket. SockJS — полифилл для браузеров без нативного WebSocket.

**`connectHeaders: { Authorization: "Bearer <token>" }`**
JWT передаётся в STOMP CONNECT-фрейме, не в HTTP-заголовках. `WebSocketAuthInterceptor` на сервере читает его.

**`reconnectDelay: 5000`**
При разрыве соединения STOMP автоматически переподключается через 5 секунд.

**`return () => stomp.deactivate()`**
Cleanup функция `useEffect` — закрывает WebSocket при размонтировании компонента или при изменении `chatId`.

**`stomp.publish({ destination: '/app/chat/5', body: text })`**
Отправляет сообщение. `/app` + путь из `configureMessageBroker → setApplicationDestinationPrefixes` → попадает в `@MessageMapping("/chat/{chatId}")`.

---

### useChats.ts

```typescript
export function useChats() {
  return useQuery({
    queryKey: ['chats'],
    queryFn: async () => client.get<ChatPreview[]>('/chats').then(r => r.data),
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}
```

**`staleTime: 0`**
Данные чатов считаются устаревшими сразу — при каждом фокусе окна (`refetchOnWindowFocus: true`) список чатов перезагружается. Это важно для чатов — другой пользователь мог написать новое сообщение.

---

### useMessages.ts

```typescript
export function useMessages(chatId: number | undefined) {
  return useCursorPagination<ChatMessage>(
    ['messages', chatId],
    `/chats/${chatId}/messages`,
    'messageId',
    50,  // лимит 50 сообщений за страницу (больше, чем для постов)
  );
}
```

Использует общий `useCursorPagination` — та же логика cursor-based пагинации, что и для постов. При прокрутке вверх подгружаются более старые сообщения.
