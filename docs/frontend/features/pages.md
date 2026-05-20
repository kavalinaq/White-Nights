# Страницы (Pages) — frontend/features/

## Назначение

Страницы — это React-компоненты верхнего уровня для каждого маршрута. Они используют хуки для данных и рендерят UI. Ниже разобраны ключевые паттерны из нескольких представительных страниц.

## FeedPage.tsx

```tsx
export function FeedPage() {
  const { items, hasMore, loadMore, isLoading, isFetching } = useFeed();
  const [showCreate, setShowCreate] = useState(false);
  const [reportPostId, setReportPostId] = useState<number | null>(null);

  return (
    <div>
      {isLoading && [1,2,3].map(i => <div key={i} className="h-40 animate-pulse" />)}
      {!isLoading && items.length === 0 && <EmptyState />}
      {items.map(post => <PostCard key={post.postId} post={post} onReport={id => setReportPostId(id)} />)}
      {hasMore && <button onClick={() => loadMore()}>Load more</button>}
      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} />}
      {reportPostId !== null && <ReportModal targetType="post" targetId={reportPostId} onClose={() => setReportPostId(null)} />}
    </div>
  );
}
```

**Skeleton-загрузка**
`animate-pulse` — Tailwind анимация пульсации. Три прямоугольника-заглушки показываются пока данные загружаются — лучше, чем спиннер.

**`reportPostId !== null`**
Хранит ID поста для жалобы. `null` — модал закрыт. При открытии: `setReportPostId(postId)`. `ReportModal` показывается условно — если не `null`.

---

## PostPage.tsx

### CommentItem — вложенный компонент

```tsx
function CommentItem({ comment, postAuthorNickname, currentUser, addComment, deleteComment }) {
  const [showReplies, setShowReplies] = useState(false);
  const { data: replies } = useReplies(comment.commentId, showReplies);

  const canDelete = currentUser?.nickname === comment.author.nickname
    || currentUser?.nickname === postAuthorNickname
    || currentUser?.role === 'moderator'
    || currentUser?.role === 'admin';
}
```

**`useReplies(commentId, enabled: showReplies)`**
Ответы загружаются только когда `showReplies = true`. Ленивая загрузка — не нужно загружать все ответы сразу.

**`canDelete` — клиентская проверка прав**
Кнопка «Удалить» показывается: автору комментария, владельцу поста (может удалять в своих постах), модераторам/администраторам. Серверная проверка дублирует эту логику.

### recordView при открытии поста

```tsx
useEffect(() => {
  if (postId) recordView();
}, [postId, recordView]);
```

`useEffect` с `[postId]` — срабатывает при первом рендере и при изменении `postId`. `recordView` — `useCallback` из `useInteractions`, не меняется между рендерами.

---

## TrackerPage.tsx

### Построение сетки календаря

```tsx
const daysInMonth = new Date(year, month + 1, 0).getDate();
const firstDay = new Date(year, month, 1).getDay();
const offset = (firstDay + 6) % 7;  // 0=Mon, 1=Tue, ..., 6=Sun
```

**`new Date(year, month + 1, 0)`**
День `0` следующего месяца = последний день текущего. Хитрый способ получить количество дней в месяце.

**`(firstDay + 6) % 7`**
JavaScript: `getDay()` возвращает 0=воскресенье, 1=понедельник. Нам нужно 0=понедельник (европейский стиль). `(0 + 6) % 7 = 6` (вс), `(1 + 6) % 7 = 0` (пн) — смещение на 1 день.

### `useMemo` для словаря по дате

```tsx
const entryByDate = useMemo(() => {
  const map: Record<string, number | null> = {};
  entries?.forEach((e) => { map[e.date] = e.pagesRead; });
  return map;
}, [entries]);
```

**`useMemo`**
Мемоизация: пересоздаёт `map` только при изменении `entries`. При каждом рендере (например, при выборе даты) пересоздавать словарь не нужно.

### Локализованное имя месяца

```tsx
const monthName = new Date(year, month, 1).toLocaleString(i18n.language, {month: 'long', year: 'numeric'});
```

`toLocaleString` с `i18n.language` — «Январь 2025» на русском, «January 2025» на английском.

---

## Паттерн модальных окон

Все модалы управляются через `useState` в родительском компоненте:
```tsx
const [showCreate, setShowCreate] = useState(false);
// ...
{showCreate && <CreatePostModal onClose={() => setShowCreate(false)} />}
```
`&&` — монтирует компонент только когда нужен. При закрытии `setShowCreate(false)` → условие `false` → компонент размонтируется.
