# SearchPage, ShelvesPage, TagPage

## Назначение

Три страницы поиска и навигации по контенту. `SearchPage` — глобальный поиск по пользователям, тегам и постам с дебаунсом. `ShelvesPage` — книжные полки пользователя. `TagPage` — посты с конкретным тегом.

---

## SearchPage

### Дебаунс поискового запроса

```tsx
const [input, setInput] = useState(initialQ);
const [debouncedQ, setDebouncedQ] = useState(initialQ);
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
    setDebouncedQ(input);
    if (input.trim()) setSearchParams({ q: input.trim() }, { replace: true });
    else setSearchParams({}, { replace: true });
  }, 300);
  return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
}, [input, setSearchParams]);
```

**Два стейта** — `input` (что в поле ввода) и `debouncedQ` (что отправляется в API). Между ними задержка 300мс.

**`ReturnType<typeof setTimeout>`** — TypeScript-тип, возвращаемый функцией `setTimeout`. В браузере это число, в Node.js — объект. `ReturnType<...>` позволяет написать правильный тип без хардкода.

**Дебаунс-логика:**
1. При каждом нажатии клавиши отменяем предыдущий таймер (`clearTimeout`)
2. Запускаем новый таймер на 300мс
3. Если пользователь ничего не нажимал 300мс — обновляем `debouncedQ`
4. `return () => { clearTimeout(...) }` — функция очистки `useEffect`, вызывается при размонтировании

**`setSearchParams({ q: input }, { replace: true })`** — синхронизируем поисковый запрос с URL (`?q=...`). `replace: true` — не создаёт новую запись в истории браузера, а заменяет текущую (кнопка «Назад» работает правильно).

---

### Начальное значение из URL

```tsx
const initialQ = searchParams.get('q') ?? '';
const [input, setInput] = useState(initialQ);
```

Если пользователь зашёл по прямой ссылке `/search?q=tolkien` — поле ввода заполнено сразу. `?? ''` — если параметра нет, используем пустую строку.

---

### Отображение результатов

```tsx
const hasResults = data && (data.users.length > 0 || data.posts.length > 0 || data.tags.length > 0);
```

Проверяем наличие хотя бы одного результата любого типа. Это условие определяет, показывать ли «Нет результатов» или нет.

Три секции (пользователи, теги, посты) показываются только если в них есть данные:
```tsx
{data.users.length > 0 && <section>...</section>}
{data.tags.length > 0 && <section>...</section>}
{data.posts.length > 0 && <section>...</section>}
```

---

## ShelvesPage

### Разрешения и состояние

```tsx
const isOwn = user?.nickname === nickname;
```

Сравнение никнеймов определяет, видна ли кнопка «Добавить книгу» и контролы удаления/перемещения.

```tsx
const [addingTo, setAddingTo] = useState<number | null>(null);
```

`addingTo` хранит `shelfId` полки, в которую добавляем книгу. `null` — модал закрыт. Когда `addingTo !== null` — показывается overlay с формой.

---

### Форма добавления книги — overlay

```tsx
{addingTo !== null && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    ...
  </div>
)}
```

`fixed inset-0` — фиксированный элемент, занимающий весь экран. `bg-black/50` — чёрный с 50% прозрачностью. `z-50` — поверх всего.

---

### `ShelfCard` — компонент полки

```tsx
<select value={shelf.shelfId} onChange={(e) => onMove(book.bookId, Number(e.target.value))}>
  {allShelves.map((s) => <option key={s.shelfId} value={s.shelfId}>{s.name}</option>)}
</select>
```

Выпадающий список всех полок для перемещения книги. Текущая полка выбрана по умолчанию (`value={shelf.shelfId}`). При изменении вызывается `onMove` с ID книги и ID целевой полки. `Number(e.target.value)` — значение `<option>` всегда строка, преобразуем в число.

---

## TagPage

```tsx
const { name } = useParams<{ name: string }>();
const tagName = name ?? '';
```

Из URL `/tags/fiction` получаем `name = 'fiction'`. `?? ''` — запасное значение если параметр не найден (теоретически не должно случиться при правильном роутинге).

Страница максимально простая: заголовок `#tagName`, список постов с пагинацией через `loadMore`, кнопка «Загрузить ещё». Паттерн такой же как в `FeedPage`.

```tsx
<Link to="/search" className="text-sm text-[#7a6f68] hover:text-[#5b63d3] transition-colors">
  ← {t('nav.search')}
</Link>
```

Хлебная крошка «назад к поиску» — простая ссылка.
