# CreatePostModal, EditPostModal, ReportModal

## Назначение

Три модальных окна для работы с постами. `CreatePostModal` — форма создания нового поста. `EditPostModal` — редактирование существующего. `ReportModal` — отправка жалобы на пост, комментарий или пользователя.

---

## CreatePostModal

### Предпросмотр изображения

```tsx
const [image, setImage] = useState<File | null>(null);
const [preview, setPreview] = useState<string | null>(null);

const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0] ?? null;
  setImage(file);
  setPreview(file ? URL.createObjectURL(file) : null);
};
```

`URL.createObjectURL(file)` — создаёт временный локальный URL вида `blob:http://localhost:5173/...`. Браузер может отобразить изображение без загрузки на сервер. `setPreview(null)` если файл не выбран.

```tsx
<button
  type="button"
  onClick={() => { setImage(null); setPreview(null); }}
>✕</button>
```

`type="button"` — важно! Без этого атрибута кнопка внутри `<form>` по умолчанию является кнопкой `submit`. Нажатие «✕» сабмитило бы форму.

---

### Обработка тегов

```tsx
const tagNames = tagInput.split(',').map((s) => s.trim()).filter(Boolean);
```

Строка `"fantasy, fiction, tolkien"` → `["fantasy", "fiction", "tolkien"]`.

- `split(',')` — разбивает по запятой
- `.map((s) => s.trim())` — убирает пробелы у каждого элемента
- `.filter(Boolean)` — удаляет пустые строки (например, если в конце была запятая)

---

### Стиль через переменную

```tsx
const inputCls = "w-full px-3 py-2.5 rounded-lg border border-[#e8e2d9] bg-white text-sm ...";
```

Константа с классами Tailwind — чтобы не копировать длинную строку для каждого поля. При `textarea` добавляем `resize-y`:
```tsx
className={inputCls + ' resize-y'}
```

---

## EditPostModal

```tsx
const [tagInput, setTagInput] = useState(post.tags.map((tag) => tag.name).join(', '));
```

Инициализируем поле тегов из существующих тегов поста. `map` извлекает имена, `join(', ')` соединяет через запятую — получаем строку `"fantasy, fiction"`.

```tsx
const [preview, setPreview] = useState<string | null>(post.imageUrl ?? null);
```

Предпросмотр инициализирован текущим URL изображения (если есть). Пользователь видит существующую обложку сразу.

Логика полностью аналогична `CreatePostModal`, только начальные значения полей берутся из `post` (объект существующего поста).

---

## ReportModal

```tsx
interface Props {
  targetType: 'post' | 'comment' | 'user';
  targetId: number;
  onClose: () => void;
}
```

Универсальный модал для трёх типов объектов. `targetType` и `targetId` передаются снаружи — модал сам не знает, что именно жалуются.

```tsx
await report.mutateAsync({ targetType, targetId, reason });
onClose();
```

После успешной отправки сразу закрываем модал. Нет промежуточного «Успешно» сообщения — сервер принял жалобу, модал закрылся.

```tsx
<button type="submit" disabled={report.isPending || reason.length < 10}>
```

Две причины блокировки кнопки:
1. `report.isPending` — запрос выполняется
2. `reason.length < 10` — текст жалобы слишком короткий (минимум 10 символов задан в `minLength={10}` и продублирован в `disabled`)

```tsx
{(report.error as any).response?.data?.detail || t('errors.generic')}
```

`as any` с комментарием `eslint-disable` — намеренное отключение строгой типизации для доступа к структуре ошибки axios. Лучший подход — `extractApiError`, но здесь используется прямой доступ.
