# ChatsPage, ChatListItem, ChatView, GroupInfoModal

## Назначение

Страница чатов — двухколоночный layout: левый сайдбар со списком чатов и правая область с активным чатом. `ChatView` — компонент просмотра и отправки сообщений. `GroupInfoModal` — информация о групповом чате с изменением аватара.

---

## ChatsPage

### `useUserSuggestions` — поиск пользователей для нового чата

```tsx
function useUserSuggestions(query: string) {
  return useQuery({
    queryKey: ['user-suggestions', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const res = await client.get('/search', { params: { q: query } });
      return res.data.users.slice(0, 6);
    },
    enabled: query.trim().length >= 1,
    staleTime: 5000,
  });
}
```

**`enabled: query.trim().length >= 1`** — запрос не выполняется, если строка пустая. Предотвращает лишние запросы при монтировании компонента.

**`staleTime: 5000`** — результаты поиска считаются свежими 5 секунд. Если тот же запрос выполняется снова — данные берутся из кеша без запроса к API.

**`.slice(0, 6)`** — показываем максимум 6 подсказок.

---

### Состояние компонента

```tsx
const { id } = useParams<{ id: string }>();
const activeId = id ? Number(id) : undefined;
```

URL `/chat/5` → `id = '5'` (строка). `Number(id)` преобразует в число. Если URL `/chat` без ID — `id` будет `undefined`, чат не выбран.

```tsx
const totalUnread = (chats ?? []).filter((c) =>
  isUnread(c.lastMessage, c.chatId, user?.nickname, lastSeenAt)
).length;

void totalUnread;
```

Считаем непрочитанные чаты. `void totalUnread` — специальная конструкция для подавления предупреждения TypeScript «переменная объявлена, но не используется». Данные читаются из Zustand-стора напрямую в `App.tsx` для бейджа на иконке чатов.

---

### Создание личного чата

```tsx
const handleNewDirectChat = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const profileRes = await client.get(`/users/${peerNickname.trim()}`);
    const peerId: number = profileRes.data.userId;
    const result = await createChat.mutateAsync({ peerId });
    navigate(`/chat/${result.data.chatId}`);
  } catch (err: unknown) {
    const msg = extractApiError(err);
    setNewChatError(msg || t('chat.userNotFoundOrError'));
  }
};
```

Два последовательных запроса: сначала ищем пользователя по никнейму, получаем его `userId`, затем создаём чат. `e.preventDefault()` отменяет стандартную отправку формы (перезагрузку страницы).

---

### Подсказки в инпуте (autocomplete)

```tsx
onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
```

При потере фокуса (`onBlur`) скрываем список через 150мс задержку. Задержка нужна, чтобы успел сработать `onClick` на кнопке-подсказке — без задержки список скрывается раньше, чем `click` обрабатывается.

```tsx
onMouseDown={() => { setPeerNickname(u.nickname); setShowSuggestions(false); }}
```

`onMouseDown` срабатывает раньше `onBlur` в цепочке событий. Именно поэтому подсказка выбирается до закрытия списка.

---

## ChatView

### Структура данных сообщений

```tsx
const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
const [messagePatches, setMessagePatches] = useState<Record<number, Partial<ChatMessage>>>({});
```

**`liveMessages`** — сообщения, пришедшие через WebSocket в этой сессии.

**`messagePatches`** — оверрайды для конкретных сообщений (например, `isDeleted: true`). `Record<number, Partial<ChatMessage>>` — объект где ключ — `messageId`, значение — частичное обновление сообщения.

```tsx
const allMessages = [...history].reverse().concat(liveMessages).map((m) =>
  messagePatches[m.messageId] ? { ...m, ...messagePatches[m.messageId] } : m
);
```

Объединяем историю (загружена курсором, в обратном порядке) и live-сообщения (в прямом). Для каждого сообщения применяем патч если есть. `{ ...m, ...patch }` — spread-merge: берём все поля `m`, переопределяем полями `patch`.

---

### WebSocket

```tsx
const { connected, sendMessage } = useChatSocket(chatId, (msg) => {
  setLiveMessages((prev) => {
    const exists = prev.find((m) => m.messageId === msg.messageId);
    if (exists) return prev.map((m) => m.messageId === msg.messageId ? msg : m);
    return [...prev, msg];
  });
  if (msg.isDeleted) {
    setMessagePatches((prev) => ({ ...prev, [msg.messageId]: { isDeleted: true, text: null, imageUrl: null } }));
  }
});
```

При получении сообщения через WS: если сообщение уже есть (например, эхо собственного) — обновляем, иначе добавляем. Если сообщение удалено — записываем патч в `messagePatches`.

---

### Онлайн-статус

```tsx
const { data: presenceData } = useQuery({
  queryKey: ['presence', chatName],
  queryFn: () => client.get(`/users/${chatName}/online`).then((r) => r.data),
  enabled: !isGroup && !!chatName,
  refetchInterval: 30000,
});
```

Опрашиваем онлайн-статус каждые 30 секунд. Только для личных чатов (`!isGroup`). `chatName` для личного чата — это никнейм собеседника.

---

### Прокрутка к последнему сообщению

```tsx
const bottomRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [allMessages.length]);
```

`bottomRef` — ссылка на невидимый `<div ref={bottomRef} />` в конце списка сообщений. Когда длина массива меняется (новое сообщение) — `scrollIntoView` плавно прокручивает к нему.

---

### Оптимистичное удаление сообщения

```tsx
const handleDeleteMessage = async (messageId: number) => {
  // Сразу показываем как удалённое
  setMessagePatches((prev) => ({ ...prev, [messageId]: { isDeleted: true, text: null, imageUrl: null } }));
  try {
    await deleteMessage.mutateAsync(messageId);
  } catch {
    // Откатываем если запрос провалился
    setMessagePatches((prev) => {
      const copy = { ...prev };
      delete copy[messageId];
      return copy;
    });
  }
};
```

UI обновляется немедленно (оптимистично), не дожидаясь сервера. Если запрос упал — откатываем через `delete copy[messageId]`.

---

### Загрузка изображения

```tsx
const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  e.target.value = '';  // сбрасываем, чтобы можно было выбрать тот же файл снова
  setUploadingImage(true);
  try {
    const formData = new FormData();
    formData.append('file', file);
    await client.post(`/chats/${chatId}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  } finally {
    setUploadingImage(false);
  }
};
```

После загрузки сервер сам рассылает `MessageResponse` через WebSocket — клиент получит изображение как обычное сообщение. Поэтому здесь нет `setLiveMessages`.

---

### Кнопка отправки через скрытый `<input type="file">`

```tsx
const fileInputRef = useRef<HTMLInputElement | null>(null);

<input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
<button onClick={() => fileInputRef.current?.click()}>📷</button>
```

Стандартная техника: скрываем некрасивый `<input type="file">`, кликаем по нему программно через `ref`.

---

## GroupInfoModal

```tsx
const canEdit = !!user && chat.ownerId === user.id;
```

Редактировать аватар может только создатель группы (`owner`). `!!user` — преобразует объект в булево значение (если не залогинен — `false`).

```tsx
const avatarSrc = previewUrl || chat.avatarUrl;
```

Если пользователь только что выбрал новый файл — показываем локальный `previewUrl` (URL.createObjectURL). Иначе — URL с сервера.

```tsx
const handleFile = async (file: File) => {
  setPreviewUrl(URL.createObjectURL(file));
  await updateAvatar.mutateAsync(file);
};
```

`URL.createObjectURL(file)` — создаёт временный локальный URL для отображения файла без загрузки на сервер. Так аватар меняется мгновенно, не дожидаясь ответа API.

```tsx
<div onClick={onClose}>
  <div onClick={(e) => e.stopPropagation()}>
    ...контент...
  </div>
</div>
```

Клик на тёмный оверлей закрывает модал. `stopPropagation()` на внутреннем `div` — предотвращает «всплытие» события клика до оверлея (иначе модал закрывался бы при клике на любой элемент внутри).
