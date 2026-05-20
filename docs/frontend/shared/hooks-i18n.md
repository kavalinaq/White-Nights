# shared/hooks и shared/i18n

## useCursorPagination.ts

### Назначение

Универсальный хук для бесконечной прокрутки через cursor-based пагинацию. Используется везде, где нужно подгружать данные постранично: лента постов, поиск, комментарии и т.д.

### Полный разбор кода

```typescript
export function useCursorPagination<T extends Record<string, any>>(
  queryKey: unknown[],
  url: string,
  idField: keyof T,
  limit = 20,
  params: Record<string, string | number | undefined> = {},
  enabled = true,
) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const response = await client.get<T[]>(url, {
        params: { ...params, cursor: pageParam, limit },
      });
      return response.data;
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < limit) return undefined;
      return lastPage[lastPage.length - 1][idField] as number;
    },
    enabled,
  });

  return {
    items: query.data?.pages.flat() ?? [],
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
    isLoading: query.isLoading,
    ...
  };
}
```

**`useInfiniteQuery`**
TanStack Query хук для загрузки данных «страницами». Каждый вызов `fetchNextPage()` добавляет новую страницу к `data.pages`.

**`pageParam`**
TanStack Query передаёт его в `queryFn`. Первый запрос: `pageParam = initialPageParam = undefined` (cursor = undefined → первая страница). Последующие: `pageParam = lastId`.

**`getNextPageParam: (lastPage) => ...`**
Вызывается после каждой загрузки для определения параметра следующей страницы. Если `lastPage.length < limit` — данные кончились, вернуть `undefined` (нет следующей страницы). Иначе — ID последнего элемента страницы.

**`lastPage[lastPage.length - 1][idField]`**
Берёт последний элемент последней страницы и его поле `idField`. Например, для постов: `idField = 'postId'` → курсор = ID последнего поста.

**`query.data?.pages.flat()`**
`pages` — массив массивов (каждая страница — массив элементов). `.flat()` объединяет всё в один плоский массив.

**`T extends Record<string, any>`**
Generic constraint: тип `T` должен быть объектом. Позволяет безопасно обратиться к `T[idField]`.

---

## shared/i18n/index.ts

### Назначение

Настройка интернационализации через i18next. Поддерживает русский и английский языки.

### Полный разбор кода

```typescript
i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ru: { translation: ru },
      },
      fallbackLng: 'en',
      supportedLngs: ['en', 'ru'],
      interpolation: { escapeValue: false },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'lang',
      },
    });
```

**`LanguageDetector`**
Плагин, автоматически определяющий язык пользователя. `order: ['localStorage', 'navigator']` — сначала проверяет сохранённый выбор в localStorage, затем язык браузера.

**`lookupLocalStorage: 'lang'`**
Ключ в localStorage для хранения выбора пользователя. При переключении языка через кнопку значение сохраняется в `lang`.

**`fallbackLng: 'en'`**
Если перевод для ключа не найден в текущем языке — берётся из английского.

**`escapeValue: false`**
Отключает HTML-экранирование в переводах. Безопасно для React, который сам экранирует вывод.

**Использование в компонентах:**
```tsx
const { t } = useTranslation();
t('nav.feed')  // → "Feed" (en) или "Лента" (ru)
```
