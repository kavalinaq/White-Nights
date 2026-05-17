# White Nights

Социальная сеть для любителей книг — публикуй рецензии, следи за друзьями, организуй личную библиотеку.

---

## Содержание

- [Стек технологий](#стек-технологий)
- [Быстрый старт](#быстрый-старт)
- [Структура проекта](#структура-проекта)
- [API-справочник](#api-справочник)
- [WebSocket](#websocket)
- [Аутентификация](#аутентификация)
- [База данных и миграции](#база-данных-и-миграции)
- [Хранилище файлов](#хранилище-файлов)
- [Роли и права доступа](#роли-и-права-доступа)
- [Конфигурация](#конфигурация)

---

## Стек технологий

| Слой | Технология |
|---|---|
| Язык | Java 25 |
| Фреймворк | Spring Boot 3.5 |
| База данных | PostgreSQL 15 |
| Миграции | Flyway |
| ORM | Spring Data JPA / Hibernate |
| Аутентификация | JWT (JJWT) + Refresh-токены |
| Хранилище файлов | MinIO (S3-совместимый) |
| Real-time | Spring WebSocket + STOMP over SockJS |
| Сборка | Gradle |
| Утилиты | Lombok, Bucket4j (rate limiting) |
| Интернационализация | i18next + react-i18next (en / ru) |

---

## Быстрый старт

### Требования

- **Docker & Docker Compose** (для БД и хранилища)
- **JDK 25**
- **Node.js 20+** и **npm**
- **Gradle** (или используйте встроенный `./gradlew`)

### 1. Запуск инфраструктуры

В корне проекта выполните:
```bash
docker compose up -d
```

Запускает:
- **PostgreSQL** на порту `5432` (логин: `user` / пароль: `password`)
- **MinIO** на портах `9000` (API) и `9001` (консоль)

### 2. Настройка MinIO

Бакеты MinIO создаются **автоматически** при первой загрузке файла — ничего настраивать вручную не нужно. Если хотите создать их заранее через CLI (если установлен `mc`):
```bash
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/avatars
mc mb local/posts
mc mb local/chat
mc anonymous set public local/avatars
mc anonymous set public local/posts
mc anonymous set public local/chat
```

### 3. Запуск бэкенда

```bash
cd backend
./gradlew bootRun
```
API будет доступно на `http://localhost:8080`.

### 4. Запуск фронтенда

В новом терминале:
```bash
cd frontend
npm install
npm run dev
```
Приложение будет доступно на `http://localhost:5173`. Все запросы к `/api` автоматически проксируются на бэкенд (порт `8080`).

---

## Локальная разработка

| Сервис | URL | Описание |
|---|---|---|
| Frontend | `http://localhost:5173` | Интерфейс приложения |
| Backend API | `http://localhost:8080` | Swagger/OpenAPI (если включен) и эндпоинты |
| PostgreSQL | `localhost:5432` | База данных `whitenights` |
| MinIO Console | `http://localhost:9001` | Управление файловым хранилищем |
| MinIO API | `http://localhost:9000` | S3-совместимый API |

Язык интерфейса (EN/RU) переключается в верхней панели; выбор сохраняется в `localStorage` под ключом `lang`. По умолчанию используется английский.

---

## Структура проекта

```
backend/src/main/java/com/whitenights/
├── admin/          — управление пользователями и статистика (только admin)
├── auth/           — регистрация, верификация, JWT, refresh-токены, сброс пароля
├── bookshelf/      — книжные полки и книги пользователя
├── chat/           — чаты (1:1 и групповые), WebSocket, присутствие
├── common/         — общие компоненты: безопасность, хранилище, email, исключения
├── feed/           — лента постов подписок
├── moderation/     — очередь репортов и модераторские действия
├── post/           — посты, комментарии, лайки, сохранения, просмотры
├── search/         — полнотекстовый и тригрим-поиск по пользователям, постам, тегам
├── settings/       — сохранённые посты, смена пароля, поддержка, удаление аккаунта
├── tag/            — теги: поиск, последние, посты по тегу
├── tracker/        — трекер чтения по датам
└── user/           — профили, подписки, запросы на подписку
```

Миграции БД: `backend/src/main/resources/db/migration/`

---

## API-справочник

Базовый URL: `http://localhost:8080`

Все защищённые эндпоинты требуют заголовок:
```
Authorization: Bearer <access_token>
```

---

### Аутентификация `/api/auth`

| Метод | Путь | Тело | Описание |
|---|---|---|---|
| POST | `/api/auth/register` | `{ nickname, email, password }` | Регистрация; отправляет письмо с верификацией |
| POST | `/api/auth/verify` | `{ token }` | Активация аккаунта |
| POST | `/api/auth/login` | `{ email, password }` | Вход; возвращает `accessToken` и `refreshToken` |
| POST | `/api/auth/refresh` | `{ refreshToken }` | Обновление access-токена |
| POST | `/api/auth/logout` | `{ refreshToken }` | Выход (отзыв refresh-токена) |
| POST | `/api/auth/password/reset-request` | `{ email }` | Запрос ссылки для сброса пароля |
| POST | `/api/auth/password/reset` | `{ token, newPassword }` | Сброс пароля |

**Ограничения:**
- Никнейм: 3–50 символов, уникальный
- Пароль: ≥ 8 символов
- Верификация email обязательна для входа
- Забаненные аккаунты не могут войти
- Rate limiting на login и reset-request

---

### Профили `/api/users`

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/users/me` | Мой профиль (требует auth) |
| GET | `/api/users/:nickname` | Профиль по никнейму |
| PATCH | `/api/users/me` | Изменить никнейм / bio / isPrivate |
| POST | `/api/users/me/avatar` | Загрузить аватар (multipart `file`) |
| DELETE | `/api/users/me/avatar` | Удалить аватар |
| GET | `/api/users/:id/followers` | Список подписчиков |
| GET | `/api/users/:id/following` | Список подписок |
| GET | `/api/users/:nickname/online` | Статус онлайн → `{ "online": true/false }` |
| POST | `/api/users/:nickname/block` | Заблокировать пользователя |
| DELETE | `/api/users/:nickname/block` | Разблокировать пользователя |

В ответе профиля содержится поле `isBlocked: boolean` — заблокирован ли просматриваемый пользователь текущим пользователем.

**Приватные профили:** посторонние видят только никнейм, аватар и bio.

---

### Подписки `/api/users`

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/users/:id/follow` | Подписаться (публичный — сразу; приватный — запрос) |
| DELETE | `/api/users/:id/follow` | Отписаться |
| GET | `/api/users/me/follow-requests` | Входящие запросы на подписку |
| POST | `/api/users/me/follow-requests/:followerId/accept` | Принять запрос |
| POST | `/api/users/me/follow-requests/:followerId/reject` | Отклонить запрос |

---

### Посты

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/posts` | Создать пост (multipart: `data` JSON + `image` опционально) |
| GET | `/api/posts/:id` | Получить пост |
| PATCH | `/api/posts/:id` | Редактировать (автор или модератор) |
| DELETE | `/api/posts/:id` | Удалить (автор или модератор) |
| GET | `/api/users/:id/posts?cursor=&limit=` | Посты пользователя |

**Тело создания поста** (`data`):
```json
{
  "title": "Мастер и Маргарита",
  "author": "Михаил Булгаков",
  "description": "Великий роман...",
  "tagNames": ["классика", "мистика"],
  "tagIds": []
}
```

---

### Взаимодействия с постами

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/posts/:id/like` | Лайкнуть |
| DELETE | `/api/posts/:id/like` | Убрать лайк |
| POST | `/api/posts/:id/save` | Сохранить |
| DELETE | `/api/posts/:id/save` | Убрать сохранение |
| POST | `/api/posts/:id/view` | Зафиксировать просмотр (идемпотентно) |
| GET | `/api/posts/:id/comments?cursor=&limit=` | Комментарии |
| POST | `/api/posts/:id/comments` | Добавить комментарий `{ text }` |
| DELETE | `/api/comments/:id` | Удалить комментарий (автор или модератор) |

---

### Лента `/api/feed`

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/feed?cursor=&limit=` | Посты из подписок (cursor pagination) |

Возвращает посты от принятых подписок, новейшие первые. Содержит флаги `liked` и `saved` для текущего пользователя.

---

### Теги `/api/tags`

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/tags/search?q=&limit=` | Поиск тегов по префиксу |
| GET | `/api/tags/recent?limit=` | Недавние теги пользователя + глобально популярные |
| GET | `/api/tags/:name/posts?cursor=&limit=` | Посты по тегу |

---

### Поиск `/api/search`

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/search?q=&limit=` | Сгруппированные результаты (пользователи + посты + теги, 5 каждого) |
| GET | `/api/search/users?q=&cursor=&limit=` | Поиск пользователей |
| GET | `/api/search/posts?q=&cursor=&limit=` | Поиск постов |
| GET | `/api/search/tags?q=&cursor=&limit=` | Поиск тегов |

Пустой `q` возвращает 400. Приватные пользователи отображаются, но показываются только публичные поля.

---

### Книжные полки

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/users/:id/shelves` | Полки пользователя с книгами (приватность соблюдается) |
| POST | `/api/shelves/:shelfId/books` | Добавить книгу `{ title, author }` |
| DELETE | `/api/books/:bookId` | Удалить книгу |
| POST | `/api/books/:bookId/move` | Переместить `{ toShelfId, position? }` |
| POST | `/api/shelves/:shelfId/reorder` | Изменить порядок `{ bookIds: [] }` |

При регистрации автоматически создаются три полки: **«Хочу прочитать»**, **«Читаю»**, **«Прочитал»**.

---

### Трекер чтения `/api/tracker`

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/tracker?month=YYYY-MM` | Записи за месяц |
| PUT | `/api/tracker/:date` | Upsert записи `{ pagesRead? }` (дата в формате `YYYY-MM-DD`) |
| DELETE | `/api/tracker/:date` | Удалить запись |
| GET | `/api/users/:nickname/tracker/monthly-summary?month=YYYY-MM` | Сумма прочитанных страниц за месяц → `{ month, pagesRead }`. Используется для яркой плашки на профиле под основной информацией. Если `month` не указан — текущий. |

---

### Чаты (REST)

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/chats` | Список чатов с превью последнего сообщения |
| POST | `/api/chats` | Создать чат: `{ peerId }` (1:1) или `{ name, memberIds[] }` (группа) |
| GET | `/api/chats/:id/messages?cursor=&limit=` | История сообщений |
| POST | `/api/chats/:id/upload-image` | Отправить изображение (multipart `file`); загружает в MinIO и рассылает через WebSocket |
| GET | `/api/chats/:id/members` | Список участников группового чата `[{ userId, nickname, avatarUrl, role, joinedAt }]`. Используется для кликабельного списка участников с переходом на их профили. |
| POST | `/api/chats/:id/avatar` | Загрузить аватар группового чата (multipart `file`, только владелец, только групповой чат). Возвращает обновлённый `ChatResponse` с `avatarUrl`. |
| POST | `/api/chats/:id/members` | Добавить участника `{ userId }` (только владелец группы) |
| DELETE | `/api/chats/:id/members/:userId` | Удалить участника (только владелец) |
| DELETE | `/api/messages/:id` | Удалить своё сообщение (мягкое удаление) |

---

### Репорты

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/reports` | Пожаловаться `{ targetType: post/comment/user, targetId, reason }` |
| GET | `/api/reports/me` | Мои репорты |

`targetType` принимает значения `post`, `comment` и `user` — на любой из этих сущностей можно открыть жалобу с фронтенда (кнопка «⚑ Report» на постах, комментариях/ответах и профилях).

Причина: 10–1000 символов. Дублирующий ожидающий репорт возвращает 409.

---

### Модерация (роль: moderator / admin)

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/moderation/reports?status=&cursor=&limit=` | Очередь репортов |
| GET | `/api/moderation/reports/:id` | Конкретный репорт |
| POST | `/api/moderation/reports/:id/claim` | Взять в работу (`in_review`) |
| POST | `/api/moderation/reports/:id/resolve` | Вынести решение `{ action, comment }` |

Действия (`action`): `block_post`, `warn_user`, `ban_user`, `reject`.

Ответ репорта обогащён метаданными для построения кликабельных ссылок в карточке жалобы:

| Поле | Назначение |
|---|---|
| `reporterUserId`, `reporterNickname` | автор жалобы (ссылка `/u/{nickname}`) |
| `targetUserNickname` | если жалоба на пользователя — ссылка `/u/{nickname}` |
| `targetPostTitle` | если жалоба на пост — ссылка `/posts/{targetId}` |
| `targetCommentPostId`, `targetCommentText` | если жалоба на комментарий — ссылка `/posts/{targetCommentPostId}#comment-{targetId}` |

---

### Администрирование (роль: admin)

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/admin/users/:id/role` | Изменить роль `{ role: user/moderator/admin }` |
| POST | `/api/admin/users/:id/unban` | Разбанить |
| DELETE | `/api/admin/users/:id` | Удалить аккаунт |
| GET | `/api/admin/stats` | Статистика → `{ users, posts, pendingReports, chats, moderators, onlineUsers }`. Используется в разделе «Статистика», который виден только администраторам. |
| GET | `/api/admin/support/messages?limit=` | Список всех обращений в поддержку (новейшие первые) с автором, темой, сообщением, статусом (`open`/`resolved`) и ответом администратора, если есть. |
| POST | `/api/admin/support/messages/:id/reply` | Ответ администратора `{ response }`. Сохраняет текст ответа, проставляет `respondedAt` и `respondedBy`, переводит тикет в `resolved`. Пользователь видит ответ в своей истории обращений. |

Понижение последнего администратора запрещено (возвращает 403).

---

### Настройки `/api/users/me` / `/api/support`

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/users/me/saved?cursor=&limit=` | Сохранённые посты |
| POST | `/api/users/me/password` | Смена пароля `{ currentPassword, newPassword }` |
| POST | `/api/support/messages` | Написать в поддержку `{ subject?, message }` |
| GET | `/api/support/messages/me` | Мои обращения в поддержку с ответами администратора (если есть) |
| DELETE | `/api/users/me` | Удалить аккаунт |

---

## WebSocket

Соединение: `ws://localhost:8080/ws` (SockJS).

### Аутентификация

При STOMP CONNECT передайте заголовок:
```
Authorization: Bearer <access_token>
```

### Отправка сообщений

```
SEND /app/chat/{chatId}
Content-Type: application/json

{ "text": "Привет!" }
```

### Получение сообщений

Подпишитесь на:
```
/topic/chat/{chatId}
```

Сообщения с изображениями доставляются туда же (через `POST /api/chats/:id/upload-image`).

### Присутствие

Онлайн-статус отслеживается в памяти сервера (`PresenceService`). При STOMP-подключении/отключении пользователь добавляется/убирается из in-memory множества через `PresenceEventListener`.

Проверить онлайн-статус: `GET /api/users/:nickname/online` → `{ "online": true/false }`

---

## Аутентификация

Схема токенов:

| Токен | Срок жизни | Хранение |
|---|---|---|
| Access token (JWT) | 15 минут | Заголовок `Authorization: Bearer` |
| Refresh token | 14 дней | Тело запроса / localStorage клиента |

При смене пароля и бане все refresh-токены пользователя отзываются.

---

## База данных и миграции

Миграции Flyway применяются автоматически при старте приложения.

| Версия | Описание |
|---|---|
| V1 | Базовая схема: users, posts, comments, tags, likes, views, save, shelves, books, reports, moderation_actions, chats, messages |
| V2 | Таблица follows (система подписок) |
| V3 | Таблица reading_tracker |
| V4 | Индексы для производительности |
| V5 | Токены верификации email |
| V6 | Refresh-токены |
| V7 | Токены сброса пароля |
| V8 | Колонка `is_private` в users |
| V9 | Теги + колонка `is_blocked` в posts |
| V10 | Колонка `position` в shelves + ограничение уникальности |
| V11 | Расширение `pg_trgm` + GIN-индексы + `search_vector` в posts |
| V12 | Колонка `comment` в moderation_actions |
| V13 | Колонка `is_group` в chats + `is_deleted` в messages |
| V14 | Поддержка вложенных комментариев (ответов) |
| V15 | Поле `text` в messages стало nullable; добавлена колонка `image_url` |
| V16 | Таблица `user_blocks` (блокировка пользователей) |
| V17 | Колонка `avatar_url` в `chats` (аватарка групповых чатов) |
| V18 | Таблица `support_messages` (тикеты поддержки + ответы администратора) |

---

## Хранилище файлов

MinIO используется как S3-совместимое хранилище.

| Бакет | Содержимое |
|---|---|
| `avatars` | Аватары пользователей |
| `posts` | Изображения к постам |
| `chat` | Изображения, отправленные в чатах, и аватарки групповых чатов |

Файлы принимаются только с `Content-Type: image/*`. Все бакеты создаются автоматически при первой загрузке.

---

## Роли и права доступа

| Роль | Возможности |
|---|---|
| `user` | Все публичные действия: чтение, посты, взаимодействия, чаты |
| `moderator` | + Доступ к очереди репортов, блокировка постов, бан пользователей |
| `admin` | + Управление ролями, разбан, удаление аккаунтов, статистика |

Роль по умолчанию при регистрации — `user`.

---

## Конфигурация

Основной файл: `backend/src/main/resources/application.yml`

| Параметр | По умолчанию | Описание |
|---|---|---|
| `spring.datasource.url` | `jdbc:postgresql://localhost:5432/whitenights` | URL PostgreSQL |
| `auth.jwt.secret` | *(см. файл)* | Секрет JWT — **обязательно сменить в production** |
| `auth.jwt.access-expiration-ms` | `900000` (15 мин) | Срок действия access-токена |
| `auth.jwt.refresh-expiration-ms` | `1209600000` (14 дней) | Срок действия refresh-токена |
| `minio.endpoint` | `http://localhost:9000` | URL MinIO |
| `minio.access-key` | `minioadmin` | MinIO access key |
| `minio.secret-key` | `minioadmin` | MinIO secret key |
| `minio.bucket` | `avatars` | Бакет аватаров |
| `minio.posts-bucket` | `posts` | Бакет изображений постов |
| `minio.chat-bucket` | `chat` | Бакет изображений чата |
| `support.email` | `support@whitenights.local` | Адрес поддержки |

---

## Коды ошибок

| HTTP-код | Ситуация |
|---|---|
| 400 | Некорректный запрос / ошибка валидации |
| 401 | Не аутентифицирован / неверный токен / аккаунт не верифицирован / забанен |
| 403 | Недостаточно прав (приватный профиль / чужой ресурс / не та роль) |
| 404 | Ресурс не найден |
| 409 | Конфликт (дублирующий email / никнейм / репорт) |
| 429 | Слишком много запросов (rate limiting) |
