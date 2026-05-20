# shared/components: Avatar.tsx, PostCard.tsx

## Назначение

Два переиспользуемых компонента. `Avatar` — аватар пользователя с фоллбэком на инициалы. `PostCard` — карточка поста с лайком, сохранением, тегами и счётчиками.

## Полный разбор кода

### Avatar.tsx

```tsx
const sizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-24 h-24 text-3xl',
};

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const initials = name.replace(/^@/, '').slice(0, 2).toUpperCase();

  if (src) {
    return <img src={src} alt={name} className={`${base} object-cover`} />;
  }
  return (
    <div className={`${base} bg-[#e8e2d9] flex items-center justify-center...`}>
      {initials}
    </div>
  );
}
```

**`name.replace(/^@/, '').slice(0, 2).toUpperCase()`**
1. Убирает `@` в начале никнейма (если есть)
2. Берёт первые 2 символа
3. Переводит в верхний регистр
Результат: `"alice"` → `"AL"`, `"@bob"` → `"BO"`.

**Условный рендер: картинка или инициалы**
Если `src` передан — показывается `<img>`. Если нет (аватар не установлен) — цветной круг с инициалами. Это graceful degradation.

---

### PostCard.tsx

```tsx
export function PostCard({ post, onReport }: Props) {
  const { isAuthenticated } = useAuthStore();
  const { like, unlike, save, unsave } = useInteractions(post.postId);

  return (
    <article>
      {post.imageUrl && (
        <Link to={`/posts/${post.postId}`}>
          <img src={post.imageUrl} className="w-full h-full object-cover aspect-square" />
        </Link>
      )}

      <div>
        <Link to={`/u/${post.authorInfo.nickname}`}>
          <Avatar src={post.authorInfo.avatarUrl} name={post.authorInfo.nickname} size="sm" />
          @{post.authorInfo.nickname}
        </Link>

        <Link to={`/posts/${post.postId}`}>
          <h3>{post.title}</h3>
          <p>{post.description}</p>
        </Link>

        {post.tags.map(tag => (
          <Link to={`/tags/${tag.name}`}>#{tag.name}</Link>
        ))}

        {isAuthenticated ? (
          <>
            <button onClick={() => post.liked ? unlike.mutate() : like.mutate()}>
              {post.liked ? '♥' : '♡'} {post.likeCount}
            </button>
            <button onClick={() => post.saved ? unsave.mutate() : save.mutate()}>
              🔖 {post.saved ? 'Saved' : 'Save'}
            </button>
          </>
        ) : (
          <span>♡ {post.likeCount}</span>
        )}
      </div>
    </article>
  );
}
```

**`useInteractions(post.postId)`**
Хук, инкапсулирующий мутации лайка/сохранения. Возвращает четыре mutation-объекта. Вызов `.mutate()` отправляет запрос на сервер и обновляет кэш TanStack Query.

**`post.liked ? unlike.mutate() : like.mutate()`**
Toggle-логика: если пост уже лайкнут — убираем лайк. Иначе — ставим. Состояние `liked` приходит с сервера.

**`like.isPending || unlike.isPending` — `disabled`**
Блокируем кнопку пока запрос в процессе — предотвращает двойной клик.

**`isAuthenticated` — условный рендер кнопок**
Анонимный пользователь видит только счётчик лайков (без кнопки). Это и UX (нет смысла показывать недоступные кнопки) и защита.

**`onReport?.(post.postId)`**
Опциональный пропс. Кнопка «Пожаловаться» появляется только если родительский компонент передал обработчик.

**`line-clamp-3`**
Tailwind-класс, ограничивающий текст тремя строками с `...` в конце.
