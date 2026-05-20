# vite.config.ts (frontend)

## Назначение

Конфигурация Vite — инструмента сборки фронтенда. Подключает плагины React и Tailwind CSS, а также настраивает прокси для разработки: все запросы к `/api` будут перенаправлены на бэкенд `localhost:8080`, чтобы избежать CORS-ошибок.

## Полный разбор кода

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

### Построчный разбор

**`import { defineConfig } from 'vite'`**
`defineConfig` — вспомогательная функция Vite, которая даёт автодополнение в IDE. Можно было бы написать просто `export default { ... }`, но тогда TypeScript не будет подсказывать доступные параметры.

**`import react from '@vitejs/plugin-react'`**
Плагин для поддержки React: обрабатывает JSX/TSX файлы, включает Fast Refresh (горячая замена компонентов без перезагрузки страницы).

**`import tailwindcss from '@tailwindcss/vite'`**
Плагин Tailwind CSS для Vite. Автоматически сканирует все файлы проекта и генерирует только те CSS-классы, которые реально используются.

**`plugins: [react(), tailwindcss()]`**
Список активных плагинов. Каждый плагин — функция, которая возвращает объект с хуками жизненного цикла сборки.

**`server.proxy`**
Настройка dev-сервера Vite. Во время разработки (`npm run dev`) Vite запускается на `localhost:5173`, а бэкенд — на `localhost:8080`. Если React-код делает запрос к `/api/auth/login`, браузер отправит его на `localhost:5173/api/auth/login` — но это другой порт, и браузер заблокирует запрос из-за CORS.

**`'/api': { target: 'http://localhost:8080', changeOrigin: true }`**
Прокси решает проблему: Vite перехватывает все запросы на `/api/*` и перенаправляет их на `localhost:8080`. С точки зрения браузера запрос идёт на тот же сервер. `changeOrigin: true` изменяет заголовок `Host` в запросе на `localhost:8080` — некоторые серверы это требуют.
