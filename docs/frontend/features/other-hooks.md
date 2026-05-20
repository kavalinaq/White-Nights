# Остальные хуки features/

## Назначение

Оставшиеся хуки для всех фич приложения. Все следуют одному паттерну: `useQuery` для чтения, `useMutation` для изменений, `invalidateQueries` для обновления кэша.

## Полный разбор кода

### useFollow.ts

```typescript
export const useFollow = (targetUserId, targetNickname) => {
  const follow = useMutation({
    mutationFn: () => client.post(`/users/${targetUserId}/follow`),
    onMutate: () => {
      queryClient.setQueryData<Profile>(['profile', targetNickname], (old) =>
        old ? { ...old, followStatus: 'pending', followerCount: old.followerCount + 1 } : old
      );
    },
    onError: invalidate,
    onSettled: invalidate,
  });
```

**Оптимистичное обновление подписки**
`onMutate`: мгновенно меняем `followStatus: 'pending'` и увеличиваем счётчик. Пользователь видит «Запрос отправлен» сразу. `onSettled` инвалидирует и перезагружает актуальные данные с сервера.

**`[key: string]: unknown`**
Index signature в типе `Profile` — позволяет TypeScript принять `{ ...old, followStatus: 'pending' }` без ошибок типизации: `old` содержит поля, типы которых неизвестны в этом контексте.

---

### useMonthlyPages.ts

```typescript
function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
```

**`getMonth() + 1`**
В JavaScript месяцы нумеруются с 0 (январь = 0). `+1` исправляет это.

**`padStart(2, '0')`**
Добавляет ведущий ноль: `9` → `"09"`. Нужно для формата `"2025-09"`.

---

### useSearch.ts

```typescript
export function useSearch(q: string) {
  return useQuery({
    enabled: q.trim().length > 0,
    queryFn: () => client.get('/search', { params: { q } }),
  });
}
```

**`enabled: q.trim().length > 0`**
Запрос не отправляется на пустую строку. `trim()` удаляет пробелы — `"   "` тоже не вызовет запрос.

---

### useTracker.ts

```typescript
export function useUpsertTrackerEntry(month: string) {
  return useMutation({
    mutationFn: ({ date, pagesRead }) => client.put(`/tracker/${date}`, { pagesRead }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracker', month] }),
  });
}
```

**`client.put`**
`PUT` для upsert — создать или обновить запись трекера на конкретную дату. Инвалидирует кэш только текущего месяца `['tracker', month]`, а не все.

---

### useAdminStats.ts

```typescript
export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    refetchInterval: 15000,
  });
}
```

**`refetchInterval: 15000`**
Автоматически перезапрашивает статистику каждые 15 секунд. Это polling — альтернатива WebSocket для редко меняющихся данных.

---

### useModeration.ts

```typescript
export function useClaimReport() {
  return useMutation({
    mutationFn: (reportId) => client.post(`/moderation/reports/${reportId}/claim`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moderation'] }),
  });
}

export function useResolveReport() {
  return useMutation({
    mutationFn: ({ reportId, action, comment }) =>
      client.post(`/moderation/reports/${reportId}/resolve`, { action, comment }),
  });
}
```

**Инвалидация по префиксу `['moderation']`**
`{ queryKey: ['moderation'] }` инвалидирует все кэши с ключами, начинающимися с `'moderation'`: `['moderation', 'queue', 'pending']`, `['moderation', 'queue', 'in_review']` и т.д.

---

### useShelves.ts + useShelfMutations.ts

```typescript
export function useShelves(userId: number | undefined) {
  return useQuery({
    queryKey: ['shelves', userId],
    enabled: !!userId,
    queryFn: () => client.get(`/users/${userId}/shelves`).then(r => r.data),
  });
}
```

`enabled: !!userId` — загрузка только при наличии `userId`. `!!undefined = false`, `!!123 = true`.

---

### useSettings.ts

```typescript
export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => client.delete('/users/me'),
  });
}
```

Нет `onSuccess` инвалидации — после удаления аккаунта приложение перенаправит на `/login`, весь кэш очистится. `useAuthStore.logout()` вызывается в компоненте после успешной мутации.
