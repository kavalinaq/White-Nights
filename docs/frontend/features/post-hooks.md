# features/post/hooks: useInteractions, usePost, usePosts, usePostMutations, useComments

## Назначение

Пять хуков для работы с постами. Инкапсулируют все операции с сервером: чтение, создание, редактирование, удаление постов, лайки, сохранения и комментарии.

## Полный разбор кода

### useInteractions.ts — оптимистичные обновления

```typescript
export function useInteractions(postId: number) {
  const queryClient = useQueryClient();

  const patchEverywhere = (fn: PatchFn) => {
    queryClient.setQueryData<Post>(['post', postId], (old) => old ? fn(old) : old);

    const patchPages = (old: InfiniteData<Post[]> | undefined) =>
      old
        ? { ...old, pages: old.pages.map((page) => page.map((p) => p.postId === postId ? fn(p) : p)) }
        : old;

    queryClient.setQueryData<InfiniteData<Post[]>>(['feed'], patchPages);
    queryClient.setQueriesData<InfiniteData<Post[]>>({ queryKey: ['posts'] }, patchPages);
  };

  const like = useMutation({
    mutationFn: () => client.post(`/posts/${postId}/like`),
    onMutate: () => patchEverywhere((p) => ({ ...p, liked: true, likeCount: p.likeCount + 1 })),
    onError: invalidate,
    onSettled: invalidate,
  });
```

**Оптимистичные обновления**
`onMutate` — вызывается до отправки запроса. Мгновенно обновляет данные в кэше TanStack Query — пользователь видит изменение сразу. `onError` и `onSettled` — инвалидируют кэш, чтобы перезагрузить актуальные данные с сервера.

**`patchEverywhere`**
Обновляет пост сразу в трёх местах кэша: на странице отдельного поста `['post', postId]`, в ленте `['feed']` и в списке постов профиля `['posts']`. Без этого обновление в одном месте не отражалось бы в другом.

**`pages.map(page => page.map(p => ...))`**
Двойное `.map()` — `InfiniteData` хранит массив страниц, каждая страница — массив постов. Нужно пройти оба уровня для обновления нужного поста.

**`setQueriesData` (множественное число)**
Обновляет все кэши, чей ключ начинается с `['posts']` — для разных пользователей (профиль юзера А и юзера Б могут быть в кэше одновременно).

---

### usePostMutations.ts — multipart/form-data

```typescript
function buildFormData(data: PostFormData): FormData {
  const form = new FormData();
  const { image, ...rest } = data;
  form.append('data', new Blob([JSON.stringify(rest)], { type: 'application/json' }));
  if (image) form.append('image', image);
  return form;
}
```

**`new Blob([JSON.stringify(rest)], { type: 'application/json' })`**
Оборачивает JSON в `Blob` с MIME-типом `application/json`. Это нужно для корректного multipart-запроса: Spring Boot на стороне сервера читает поле `data` как JSON-объект через `@RequestPart`.

**`{ image, ...rest } = data`**
Деструктуризация с rest: отделяем `image` от остальных полей. `rest` содержит все поля кроме `image`.

**`onSuccess → invalidateQueries`**
После успешного создания/обновления/удаления инвалидируется кэш ленты и постов — TanStack Query перезагружает данные.

---

### useComments.ts

```typescript
const addComment = useMutation({
  mutationFn: ({ text, parentCommentId }) => client.post(`/posts/${postId}/comments`, { text, parentCommentId }),
  onSuccess: (_data, variables) => {
    if (variables.parentCommentId != null) {
      queryClient.invalidateQueries({ queryKey: ['replies', variables.parentCommentId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    }
    queryClient.invalidateQueries({ queryKey: ['post', postId] });
  },
});
```

**`_data, variables`**
TanStack Query передаёт в `onSuccess`: первый аргумент — ответ сервера, второй — аргументы мутации. `_` в начале имени — соглашение TypeScript/ESLint: «намеренно не используется».

**Инвалидация по типу комментария**
Если ответ (`parentCommentId != null`) — обновляем кэш ответов `['replies', parentId]`. Если верхний уровень — обновляем `['comments', postId]`. В обоих случаях инвалидируем пост для обновления счётчика `commentCount`.

**`useReplies(commentId, enabled)`**
`enabled: false` — не загружать ответы пока пользователь не нажмёт «Показать ответы». Это ленивая загрузка.
