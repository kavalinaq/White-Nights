# App.tsx

## Назначение

Корневой компонент приложения. Определяет маршрутизацию, два layout-shell (для авторизованных и неавторизованных страниц), топ-бар, боковую навигацию и route guards.

## Полный разбор кода

### Два shell-компонента

**`AppShell`** — оболочка для авторизованных страниц:
```tsx
function AppShell() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <SideNav />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

**`AuthShell`** — оболочка для auth-страниц (логин, регистрация и т.д.):
Только заголовок с логотипом + центрированный контент. Нет навигации.

**`<Outlet />`**
Место, куда React Router рендерит дочернюю страницу. Это паттерн layout routes: родитель — shell, дочерний — конкретная страница.

---

### Route guards

```tsx
function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}
```

**`isLoading`**
При старте приложения `checkAuth()` проверяет refresh token. До окончания проверки рендер приостанавливается (`return null`) — чтобы не было мгновенного редиректа на `/login` для авторизованного пользователя.

**`<Navigate to="/" replace />`**
`replace` — заменяет текущую запись в истории браузера вместо добавления новой. Кнопка «назад» не вернёт пользователя на запрещённую страницу.

---

### SideNav — динамическая навигация

```tsx
function SideNav() {
    const { user } = useAuthStore();
    const unreadCount = (chats ?? []).filter((c) => isUnread(...)).length;

    return (
        <aside>
            <NavLink to="/">📰 Feed</NavLink>
            {user && (
                <>
                    <NavLink to="/chat">
                        💬 Chat
                        {unreadCount > 0 && <span>{unreadCount}</span>}
                    </NavLink>
                    {(user.role === 'moderator' || user.role === 'admin') && (
                        <NavLink to="/moderation">🛡️ Moderation</NavLink>
                    )}
                    {user.role === 'admin' && (
                        <NavLink to="/statistics">📊 Statistics</NavLink>
                    )}
                </>
            )}
        </aside>
    );
}
```

**`NavLink`**
Как `Link`, но автоматически добавляет класс `active` когда URL совпадает с `to`. Используется с функцией `cls({ isActive })` для условного стилизования.

**Счётчик непрочитанных сообщений**
`isUnread(c.lastMessage, c.chatId, user.nickname, lastSeenAt)` — сравнивает дату последнего сообщения чата с датой последнего просмотра из `localStorage`. Количество непрочитанных чатов показывается в бейдже.

**Условный рендер по роли**
Ссылки на модерацию и статистику показываются только нужным ролям. Это визуальная защита — реальная авторизация выполняется на бэкенде и через `AdminRoute`/`ModeratorRoute`.

---

### Маршрутизация

```tsx
<Routes>
  <Route element={<AuthShell />}>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    ...
  </Route>
  <Route element={<AppShell />}>
    <Route path="/u/:nickname" element={<ProfilePage />} />
    <Route path="/tracker" element={<PrivateRoute><TrackerPage /></PrivateRoute>} />
    <Route path="*" element={<Navigate to="/" />} />
  </Route>
</Routes>
```

**Layout routes**
`<Route element={<AppShell />}>` без `path` — это layout route. Все дочерние routes рендерятся внутри `<Outlet />` этого layout.

**`path="*"`**
Wildcard — совпадает с любым нераспознанным URL. Редиректит на главную.
