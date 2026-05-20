# ProfilePage, EditProfileModal, FollowRequestsModal, FollowersModal

## Назначение

Страница профиля пользователя и три модальных окна для работы с подписками. `ProfilePage` — центральная страница профиля с заголовком, постами и кнопками действий. Модалы открываются поверх страницы без перехода на другой маршрут.

---

## ProfilePage

### Локальный хук `useBlockUser`

```tsx
function useBlockUser(nickname: string | undefined) {
  const queryClient = useQueryClient();
  const block = useMutation({
    mutationFn: () => client.post(`/users/${nickname}/block`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', nickname] }),
  });
  const unblock = useMutation({
    mutationFn: () => client.delete(`/users/${nickname}/block`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', nickname] }),
  });
  return { block, unblock };
}
```

**Хук внутри файла, не экспортируется**
Используется только в `ProfilePage`, поэтому определён рядом с компонентом. Не выносится в отдельный файл, чтобы не создавать лишнюю структуру.

**`queryClient.invalidateQueries({ queryKey: ['profile', nickname] })`**
После блокировки/разблокировки профиль нужно перезагрузить — у него меняется поле `isBlocked`. `invalidateQueries` помечает кеш устаревшим, и React Query автоматически делает повторный запрос.

---

### Основной компонент

```tsx
const { nickname } = useParams<{ nickname: string }>();
```

`useParams` извлекает переменные из URL. `{ nickname: string }` — TypeScript-тип для параметров. Если маршрут `/u/:nickname`, то для URL `/u/alice` значение `nickname` будет `'alice'`.

```tsx
const isSelf = currentUser?.nickname === profile?.nickname;
const canSeePosts = isSelf || !profile?.isPrivate || profile?.followStatus === 'accepted';
```

**`isSelf`** — сравниваем никнейм текущего пользователя с никнеймом профиля. Если совпадают — смотрим свой профиль.

**`canSeePosts`** — три условия через `||` (ИЛИ):
1. Смотрим свой профиль — можно
2. Профиль публичный (`!isPrivate`) — можно
3. Подписка принята (`followStatus === 'accepted'`) — можно
Если ни одно не выполнено — посты скрыты.

```tsx
const { items: posts, hasMore, loadMore } = usePosts(canSeePosts ? profile?.userId : undefined);
```

Если посты нельзя смотреть, передаём `undefined` как `userId`. Хук `usePosts` при `undefined` не делает запрос (обычно через `enabled: !!userId`). Умный способ «выключить» загрузку постов.

```tsx
const hasPendingRequests = isSelf && requests && requests.length > 0;
```

Кнопка «Запросы (N)» показывается только если:
- это собственный профиль (`isSelf`)
- данные загружены (`requests` не `null`/`undefined`)
- есть хотя бы один запрос (`requests.length > 0`)

### `renderFollowButton` — три состояния

```tsx
const renderFollowButton = () => {
  if (isSelf) return null;                            // свой профиль — не показываем
  if (profile.followStatus === 'accepted') return ...;  // кнопка «Отписаться»
  if (profile.followStatus === 'pending') return ...;   // кнопка «Запрос отправлен» (disabled)
  return ...;                                           // кнопка «Подписаться»
};
```

Функция внутри компонента, возвращает разный JSX в зависимости от статуса. `return null` — React-способ «ничего не рендерить».

### Сообщение `handleMessage`

```tsx
const handleMessage = async () => {
  const result = await createChat.mutateAsync({ peerId: profile.userId });
  navigate(`/chat/${result.data.chatId}`);
};
```

`mutateAsync` — асинхронная версия `mutate`, возвращает Promise с результатом мутации. Нужна здесь, чтобы после создания чата получить `chatId` и перейти к нему.

### Блокировка/разблокировка

```tsx
onClick={() => profile.isBlocked ? unblock.mutate() : block.mutate()}
```

Тернарный оператор внутри `onClick`: если заблокирован — разблокировать, иначе — заблокировать. Одна кнопка меняет поведение в зависимости от текущего состояния.

### Отображение постов

```tsx
{!canSeePosts ? (
  <div>🔒 Закрытый профиль</div>
) : (
  posts.map((post) => <PostCard key={post.postId} post={post} onReport={(id) => setReportPostId(id)} />)
)}
```

`onReport` — колбэк из `PostCard`. Когда пользователь нажимает «Пожаловаться» на пост, карточка вызывает этот колбэк с `postId`. Страница сохраняет ID в стейте, открывая `ReportModal`.

---

## EditProfileModal

```tsx
const [isPrivate, setIsPrivate] = useState(profile.isPrivate);
```

Инициализируем состояние чекбокса текущим значением профиля. Без этого чекбокс всегда начинался бы в состоянии `false`.

```tsx
const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) await uploadAvatar.mutateAsync(file);
};
```

Аватар загружается сразу при выборе файла — отдельный запрос без кнопки «Сохранить». `files?.[0]` — первый файл из выбранных (оператор `?.` защищает от `null`).

```tsx
<input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
```

`e.target.checked` — булево значение из чекбокса (в отличие от `e.target.value` для текстовых полей).

---

## FollowRequestsModal

```tsx
const { accept, reject } = useHandleFollowRequest();
```

Два хука-мутации из одного хука: `accept` и `reject`. Оба принимают `followerId` — ID пользователя, чей запрос обрабатываем.

```tsx
requests?.map((req: { followerId: number; nickname: string }) => ...)
```

Inline-тип прямо в `map` — быстрый способ типизировать объекты без создания отдельного `interface`. Работает для простых случаев.

---

## FollowersModal

```tsx
const [tab, setTab] = useState<'followers' | 'following'>(initialTab);
```

`initialTab` передаётся снаружи (`'followers'` или `'following'`) — открывается нужная вкладка сразу.

```tsx
const items = tab === 'followers' ? followers : following;
const isLoading = tab === 'followers' ? loadingFollowers : loadingFollowing;
```

Данные для обеих вкладок грузятся параллельно (оба `useFollowers` и `useFollowing` вызваны всегда). Переменная `items` указывает на нужный массив в зависимости от активной вкладки.

```tsx
{(['followers', 'following'] as const).map((key) => (
  <button onClick={() => setTab(key)}>{t(`profile.${key}`)}</button>
))}
```

`as const` — TypeScript-утверждение, что массив содержит строковые литералы, а не просто `string[]`. Это позволяет использовать элементы как тип `'followers' | 'following'`. `t(`profile.${key}`)` — динамический ключ перевода.
