# ModerationPage, StatisticsPage, SupportPage (admin)

## Назначение

Три страницы для привилегированных пользователей. `ModerationPage` — очередь жалоб с возможностью принять меры (только для модератора и администратора). `StatisticsPage` — дашборд статистики (только для администратора). `SupportPage` — очередь обращений в поддержку и форма ответа (только для администратора).

---

## ModerationPage

### Защита на уровне компонента

```tsx
if (user?.role !== 'moderator' && user?.role !== 'admin') {
  return <Navigate to="/" />;
}
```

`<Navigate to="/" />` — немедленный редирект без рендеринга страницы. Это дополнительная защита на клиенте; основная — роуты в `App.tsx` через `<ModeratorRoute>`.

---

### Двухколоночный layout

```tsx
<div className="flex gap-4">
  <ReportList status={statusFilter} selectedId={selected?.reportId} onSelect={setSelected} />
  {selected && <ReportDetail report={selected} onClose={() => setSelected(null)} />}
</div>
```

Левая колонка — список жалоб, правая — детали выбранной жалобы. Правая колонка появляется только когда жалоба выбрана.

---

### `ReportList`

```tsx
const { data: reports, isLoading } = useReportQueue(status);
```

Список жалоб зависит от активного фильтра (`pending` / `in_review` / `resolved`).

```tsx
<span className={`text-xs font-semibold px-2 py-0.5 rounded-full
  ${r.targetType === 'post' ? 'bg-blue-100 text-blue-600' :
    r.targetType === 'user' ? 'bg-purple-100 text-purple-600' :
    'bg-orange-100 text-orange-600'}`}>
  {r.targetType}
</span>
```

Цвет бейджа зависит от типа цели жалобы: синий для постов, фиолетовый для пользователей, оранжевый для комментариев.

---

### `TargetLink` — ссылка на объект жалобы

```tsx
function TargetLink({report}: { report: Report }) {
  if (report.targetType === 'user') { ... }
  if (report.targetType === 'post') { ... }
  if (report.targetType === 'comment') {
    const postId = report.targetCommentPostId;
    return <Link to={`/posts/${postId}#comment-${report.targetId}`}>...</Link>;
  }
}
```

`#comment-${report.targetId}` — якорная ссылка. При переходе браузер скроллит к элементу с `id="comment-5"`. Для комментариев нужен `postId` (номер поста), потому что комментарии не имеют собственной страницы.

---

### `ReportDetail` — панель действий

```tsx
const actions: { value: ModerationActionType; label: string; danger?: boolean }[] = [
  {value: 'reject', label: t('moderation.rejectAction')},
  {value: 'warn_user', label: t('moderation.warnUser')},
  {value: 'block_post', label: t('moderation.blockPost')},
  {value: 'ban_user', label: t('moderation.banUser'), danger: true},
];
```

Массив действий с флагом `danger` для деструктивных операций. Используется для красного цвета текста.

```tsx
{report.status === 'pending' && (
  <button onClick={handleClaim}>Взять в работу</button>
)}

{report.status !== 'resolved' && (
  <div>... форма выбора действия ...</div>
)}
```

Кнопка «Взять в работу» — только для `pending`. Форма действий — для `pending` и `in_review`. Для `resolved` — только просмотр.

```tsx
<button onClick={handleResolve}
  className={`${action === 'ban_user' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#5b63d3] hover:bg-[#4951c4]'}`}>
```

Кнопка «Применить» становится красной, если выбрано действие `ban_user`.

---

## StatisticsPage

```tsx
const tiles: Tile[] = [
  {label: t('admin.statistics.users'), value: data.users, accent: 'from-[#5b63d3] to-[#7e85e4]'},
  {label: t('admin.statistics.posts'), value: data.posts, accent: 'from-[#d35b9b] to-[#e47ec1]'},
  ...
];
```

**Паттерн data-driven UI**: данные для плиток хранятся в массиве, рендеринг — через `map`. Добавить новую плитку = добавить элемент в массив.

**`accent`** — строка с Tailwind-классами градиента. Передаётся в `className`:
```tsx
<div className={`bg-gradient-to-br ${tile.accent} text-white`}>
```

```tsx
<div className="text-5xl font-bold mt-3">{tile.value.toLocaleString()}</div>
```

`toLocaleString()` форматирует число по региональным настройкам браузера: `1000000` → `1,000,000` (в en-US) или `1 000 000` (в ru-RU).

```tsx
const {data, isLoading, error} = useAdminStats();
```

`useAdminStats` опрашивает данные каждые 15 секунд (`refetchInterval: 15000`). Статистика обновляется в реальном времени без перезагрузки страницы.

---

## SupportPage (admin)

### Двухколоночный layout

Левый сайдбар — список тикетов (прокручиваемый, `max-h-[80vh]`). Правая область — детали выбранного тикета. Аналогично `ModerationPage`.

```tsx
const [selected, setSelected] = useState<SupportMessage | null>(null);
```

Выбранный тикет. `null` — ничего не выбрано, показывается подсказка «Выберите тикет».

---

### `SupportDetail` — форма ответа

```tsx
const [text, setText] = useState(ticket.response ?? '');
```

Если тикет уже имеет ответ — заполняем поле. Администратор может обновить ответ. `?? ''` — если `response` равен `null`/`undefined` — пустая строка.

```tsx
const submit = async () => {
  if (!text.trim()) return;
  await reply.mutateAsync({id: ticket.supportMessageId, response: text.trim()});
  setSuccess(true);
  setTimeout(() => setSuccess(false), 3000);
};
```

После успешного ответа показываем зелёное сообщение «Ответ отправлен» на 3 секунды, затем скрываем. `setTimeout` возвращает таймер — при частых нажатиях таймеры могут накапливаться, но для данного UX это несущественно.

Статус тикета (`open` → `resolved`) меняется на сервере автоматически при ответе — frontend не управляет им вручную.
