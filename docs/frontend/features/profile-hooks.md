# features/profile/hooks: useProfile, useFollow, useMonthlyPages

## Назначение

Хуки для работы с профилем пользователя: загрузка данных профиля, обновление, загрузка аватара, управление подписками, сводка прочитанных страниц.

## Полный разбор кода

### useProfile.ts

```typescript
export interface Profile {
  userId: number;
  nickname: string;
  email?: string;
  bio: string | null;
  avatarUrl: string | null;
  isPrivate: boolean;
  isBlocked: boolean;
  followStatus: 'accepted' | 'pending' | null;
  postCount: number;
  followerCount: number;
  followingCount: number;
}

export const useProfile = (nickname: string) => {
  return useQuery<Profile>({
    queryKey: ['profile', nickname],
    queryFn: async () => client.get<Profile>(`/users/${nickname}`).then(r => r.data),
    enabled: !!nickname,
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return client.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
```

**`followStatus: 'accepted' | 'pending' | null`**
Статус подписки текущего пользователя на просматриваемый профиль. `null` — не подписан, `'pending'` — запрос ожидает, `'accepted'` — подписан. Используется для отображения кнопки «Подписаться» / «Запрос отправлен» / «Отписаться».

**`email?`**
Опциональное поле — видно только самому пользователю. Бэкенд не включает `email` в ответ при просмотре чужого профиля.

**`headers: { 'Content-Type': 'multipart/form-data' }`**
Axios обычно устанавливает этот заголовок автоматически, но при явном указании `FormData` — явное задание гарантирует корректный boundary в заголовке.

**`invalidateQueries({ queryKey: ['profile'] })`**
Инвалидирует все профили — `['profile']` как префикс совпадает с `['profile', 'alice']`, `['profile', 'bob']` и т.д. Используется при обновлении аватара, так как аватар отображается во многих местах.
