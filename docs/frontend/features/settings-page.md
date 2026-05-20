# SettingsPage

## Назначение

Страница настроек с четырьмя вкладками: сохранённые посты, смена пароля, служба поддержки и управление аккаунтом. Каждая вкладка — отдельный компонент-функция.

---

## Структура вкладок

```tsx
type Tab = 'saved' | 'password' | 'support' | 'account';
const [tab, setTab] = useState<Tab>('saved');
```

**`type Tab`** — TypeScript union type (объединение). Переменная `tab` может быть только одним из четырёх значений. Это статическая проверка: если написать `setTab('invalid')` — ошибка компиляции.

```tsx
{tab === 'saved' && <SavedPostsTab />}
{tab === 'password' && <PasswordTab />}
{tab === 'support' && <SupportTab />}
{tab === 'account' && <AccountTab />}
```

Условный рендеринг через `&&`. React не монтирует компоненты для неактивных вкладок (в отличие от CSS `display: none`). При смене вкладки состояние сбрасывается.

---

## SavedPostsTab

Использует `useSavedPosts()` — такой же курсорный хук с `loadMore`, как в ленте. Список сохранённых постов с кнопкой «Загрузить ещё».

---

## PasswordTab

```tsx
const [done, setDone] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  await change.mutateAsync({ currentPassword: current, newPassword: next });
  setCurrent(''); setNext(''); setDone(true);
};
```

После успешной смены очищаем поля и устанавливаем `done = true` — показывается зелёная строка «Пароль изменён». Без таймера — сообщение остаётся пока не закроешь страницу.

```tsx
{change.error && <p className="text-red-500 text-sm">{extractApiError(change.error)}</p>}
```

`change.error` — ошибка мутации TanStack Query (например, «Неверный текущий пароль»). Отображается под формой.

---

## SupportTab

```tsx
const {data: history} = useMySupport();
```

Две части: форма отправки нового обращения и история прошлых обращений.

```tsx
{history.map((m) => (
  <li key={m.supportMessageId}>
    <span className={m.status === 'resolved' ? 'bg-[#e8f5ed] text-[#2c9b5d]' : 'bg-[#fdf1e8] text-[#c4753b]'}>
      {m.status === 'resolved' ? 'Решено' : 'Открыто'}
    </span>
    ...
    {m.response ? <div>Ответ администратора: {m.response}</div> : <p>Ожидает ответа</p>}
  </li>
))}
```

Статус покрашен в зелёный (`resolved`) или оранжевый (`open`). Ответ администратора показывается только если поле `response` заполнено.

---

## AccountTab

```tsx
const handleDelete = async () => {
  if (!confirm(t('settings.deleteAccountConfirm'))) return;
  await deleteAccount.mutateAsync();
  logout(); navigate('/login');
};
```

`window.confirm()` — встроенный браузерный диалог подтверждения. Возвращает `true`/`false`. Простой способ добавить подтверждение без кастомного модала.

После удаления: выходим из системы (`logout()` чистит Zustand) и перенаправляем на страницу входа. Нет `invalidateQueries` — аккаунта больше нет, запросы не нужны.

```tsx
<div className="bg-red-50 border border-red-200 rounded-xl p-5">
  <h3 className="font-serif font-bold text-red-700 mb-2">Опасная зона</h3>
```

Визуально выделенная «Опасная зона» (красный фон, красная рамка) — стандартный UI-паттерн для деструктивных действий.
