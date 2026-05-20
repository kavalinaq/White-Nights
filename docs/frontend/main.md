# main.tsx

## Назначение

Точка входа React-приложения. Инициализирует провайдеры и монтирует приложение в DOM.

## Полный разбор кода

```tsx
const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
```

**`<StrictMode>`**
React-режим разработки — вызывает каждый компонент дважды, чтобы обнаружить побочные эффекты. В production отключается автоматически.

**`<BrowserRouter>`**
Провайдер маршрутизации. Читает текущий URL из `window.location` и предоставляет контекст для `<Routes>`, `<Link>`, `useNavigate()` и других хуков React Router.

**`<QueryClientProvider client={queryClient}>`**
Провайдер TanStack Query. `QueryClient` — центральный кэш для всех server-state запросов. Без этого провайдера `useQuery`/`useMutation` не работают.

**`document.getElementById('root')!`**
`!` (non-null assertion) — говорит TypeScript, что результат не будет `null`. Элемент `#root` всегда присутствует в `index.html`.

**`import './shared/i18n'`**
Импорт без `from` — выполняет файл как побочный эффект. Инициализирует i18next при старте приложения.
