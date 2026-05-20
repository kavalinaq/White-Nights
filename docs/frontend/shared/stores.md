# shared/store: useAuthStore.ts, useUnreadStore.ts

## Назначение

Два Zustand-стора для глобального состояния. `useAuthStore` — аутентификация (токен, данные пользователя, статус). `useUnreadStore` — отслеживание непрочитанных сообщений в чатах.

## Полный разбор кода

### useAuthStore.ts

```typescript
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: true,

  setAuth: (user, token) => {
    localStorage.setItem('access_token', token);
    set({ user, accessToken: token, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    try {
      const response = await client.post('/auth/refresh');
      const { user, accessToken } = response.data;
      localStorage.setItem('access_token', accessToken);
      set({ user, accessToken, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('access_token');
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
```

**`create<AuthState>((set) => ({...}))`**
`create` — фабричная функция Zustand. Принимает функцию с параметром `set` для обновления состояния. Возвращает React-хук `useAuthStore`.

**`isAuthenticated: !!localStorage.getItem('access_token')`**
При первом рендере: если токен есть в localStorage — считаем пользователя аутентифицированным. `!!` приводит строку к булеву. Но `isLoading: true` означает, что настоящая проверка ещё впереди.

**`isLoading: true` по умолчанию**
При старте приложения `checkAuth()` проверяет refresh token. До завершения проверки `isLoading = true` — route guards ждут результата и не делают преждевременный редирект.

**`checkAuth()`**
`POST /auth/refresh` отправляется с cookie (автоматически через `withCredentials: true`). Если cookie валиден — получаем новый access token и данные пользователя. Если нет — разлогиниваем.

---

### useUnreadStore.ts

```typescript
const STORAGE_KEY = 'chat_last_seen';

export const useUnreadStore = create<UnreadState>((set) => ({
  lastSeenAt: loadFromStorage(),
  markRead: (chatId) =>
    set((state) => {
      const updated = { ...state.lastSeenAt, [chatId]: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { lastSeenAt: updated };
    }),
}));

export function isUnread(lastMessage, chatId, currentNickname, lastSeenAt): boolean {
  if (!lastMessage) return false;
  if (lastMessage.senderNickname === currentNickname) return false;
  const seenAt = lastSeenAt[chatId];
  if (!seenAt) return true;
  return new Date(lastMessage.sentAt) > new Date(seenAt);
}
```

**`lastSeenAt: Record<number, string>`**
Словарь: `{ chatId: ISO-дата-последнего-просмотра }`. Сохраняется в localStorage — не теряется при обновлении страницы.

**`[chatId]: new Date().toISOString()`**
Computed property name: динамический ключ объекта. `{ ...state.lastSeenAt, [chatId]: "2025-01-15T10:30:00Z" }`.

**`isUnread` — функция вне стора**
Принимает `lastMessage`, `chatId`, `currentNickname` и `lastSeenAt`. Логика: если нет сообщений — не непрочитано. Если последнее сообщение от текущего пользователя — не непрочитано. Иначе: сравниваем дату сообщения с датой просмотра.

**`new Date(lastMessage.sentAt) > new Date(seenAt)`**
Объекты `Date` можно сравнивать через `>` — они приводятся к числу (timestamp).
