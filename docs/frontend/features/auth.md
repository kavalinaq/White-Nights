# features/auth: LoginPage, RegisterPage, VerifyPage, ForgotPasswordPage, ResetPasswordPage

## Назначение

Пять страниц для аутентификационного flow. Каждая — форма с `useMutation` для отправки данных на сервер.

## Общий паттерн

Все auth-страницы следуют одной схеме:
1. Локальный `useState` для полей формы
2. `useMutation` для POST-запроса
3. Условный рендер: форма → загрузка → успех/ошибка
4. `extractApiError` для отображения серверных ошибок

## Полный разбор кода

### LoginPage.tsx

```tsx
const mutation = useMutation({
  mutationFn: (data) => client.post('/auth/login', data),
  onSuccess: (response) => {
    const { accessToken, user } = response.data;
    setAuth(user, accessToken);
    navigate('/');
  },
});
```

**`onSuccess`**
Callback после успешного запроса. Сохраняет токен и данные пользователя в `useAuthStore`, затем редиректит на главную.

**`mutation.isPending`**
Блокирует кнопку во время запроса. Текст меняется на «Вход…».

---

### RegisterPage.tsx

```tsx
const [success, setSuccess] = useState(false);

const mutation = useMutation({
  mutationFn: (data) => client.post('/auth/register', data),
  onSuccess: () => setSuccess(true),
});

if (success) {
  return <SuccessMessage email={email} />;
}
```

**`success` state**
После регистрации показывается сообщение «Проверьте почту». Переключение через `setSuccess(true)` — без навигации, та же страница меняет отображаемый контент.

---

### VerifyPage.tsx

```tsx
const token = searchParams.get('token');
const hasRun = useRef(false);

useEffect(() => {
  if (token && !hasRun.current) {
    hasRun.current = true;
    mutation.mutate(token);
  }
}, [token]);
```

**`useSearchParams()`**
Хук React Router для чтения query-параметров URL. `?token=abc123` → `searchParams.get('token') = 'abc123'`.

**`useRef(false)` — защита от двойного вызова**
В `StrictMode` React в разработке монтирует компоненты дважды — `useEffect` срабатывает дважды. `hasRun.current = true` гарантирует, что запрос верификации отправляется только один раз.

**Условный рендер по состоянию мутации**
`isPending` → «Проверяем…», `isSuccess` → «Email подтверждён», `isError` → сообщение об ошибке.

---

### ForgotPasswordPage.tsx

Простая форма с одним полем email. После успеха показывает «Письмо отправлено» вместо формы. Отправляет `POST /auth/password/reset-request`.

---

### ResetPasswordPage.tsx

```tsx
const token = searchParams.get('token') ?? '';

const handleSubmit = (e) => {
  e.preventDefault();
  if (newPassword !== confirm) {
    setMatchError('Пароли не совпадают');
    return;
  }
  mutation.mutate({ token, newPassword });
};

useEffect(() => { inputRef.current?.focus(); }, []);
```

**Клиентская валидация совпадения паролей**
Проверяем `newPassword !== confirm` до отправки на сервер. Это быстрая обратная связь — не нужно ждать ответ сервера.

**`!token` — защитный рендер**
Если URL без токена — показываем сообщение об ошибке ещё до попытки запроса.

**`inputRef.current?.focus()`**
`useRef<HTMLInputElement>(null)` — ref для фокуса на первое поле при загрузке страницы. `?.` — опциональная цепочка: если `inputRef.current = null` (компонент не смонтирован) — `focus()` не вызывается.
