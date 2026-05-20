# shared/api: client.ts, extractApiError.ts

## Назначение

`client.ts` — настроенный axios-экземпляр с автоматическим добавлением JWT-токена и логикой обновления токена при 401. `extractApiError.ts` — утилита для извлечения читаемого сообщения об ошибке из ответа API.

## Полный разбор кода

### client.ts

```typescript
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const isAuthRequest = error.config.url?.includes('/auth/login') || error.config.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !error.config._retry && !isAuthRequest) {
      error.config._retry = true;
      try {
        await useAuthStore.getState().checkAuth();
        return client(error.config);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

**`axios.create({...})`**
Создаёт изолированный экземпляр axios с общей конфигурацией. Все запросы через `client` будут использовать эти настройки.

**`baseURL: import.meta.env.VITE_API_URL || '/api'`**
В production: `VITE_API_URL` из переменных среды. Локально: `/api` → Vite proxy перенаправляет на `localhost:8080`.

**`withCredentials: true`**
Разрешает отправку cookies с cross-origin запросами. Необходимо для работы `httpOnly` refresh_token cookie.

**Interceptor запроса**
Добавляет `Authorization: Bearer <token>` к каждому запросу автоматически. Альтернативой было бы передавать токен вручную в каждый запрос.

**Interceptor ответа — логика retry**
При получении 401:
1. Проверяем, что это не сам запрос логина/рефреша (иначе бесконечный цикл)
2. `_retry = true` — маркер, что мы уже пробовали обновить токен (защита от двойного retry)
3. `checkAuth()` — отправляет `POST /auth/refresh` с cookie, получает новый access token
4. Повторяем исходный запрос с новым токеном через `client(error.config)`
5. Если refresh тоже провалился — разлогиниваем и редиректим

**`useAuthStore.getState()`**
Вне React-компонентов нельзя использовать хуки. `getState()` — прямой доступ к состоянию Zustand-стора.

---

### extractApiError.ts

```typescript
export function extractApiError(err: unknown): string | undefined {
  const data = (err as { response?: { data?: { detail?: string; message?: string } } })
      .response?.data;
  return data?.detail ?? data?.message;
}
```

**Приведение типа `unknown`**
Ошибки в `catch` имеют тип `unknown` в современном TypeScript. Явный cast позволяет обратиться к полям ошибки.

**`data?.detail ?? data?.message`**
`??` (nullish coalescing) — возвращает правый операнд если левый `null` или `undefined`. Пробует `detail` (поле Problem Details), затем `message`. Если оба undefined — возвращает `undefined`, и компонент показывает дефолтное сообщение.
