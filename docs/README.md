# White Nights — Документация

Документация к исходному коду проекта White Nights — книжная социальная сеть.

Язык документации: **русский**. Каждый файл объясняет назначение класса/компонента и разбирает сложные концепции для разработчиков-новичков.

---

## Конфигурация проекта

| Файл | Описание |
|---|---|
| [docker-compose.md](config/docker-compose.md) | PostgreSQL + MinIO в Docker |
| [build.gradle.md](config/build.gradle.md) | Зависимости и сборка бэкенда |
| [application.yml.md](config/application.yml.md) | Настройки Spring Boot (БД, JWT, MinIO, почта) |
| [vite.config.md](config/vite.config.md) | Сборщик фронтенда, прокси /api |
| [package.json.md](config/package.json.md) | npm-зависимости и скрипты |
| [tsconfig.md](config/tsconfig.md) | Настройки TypeScript компилятора |

---

## Бэкенд

### Точка входа

| Файл | Описание |
|---|---|
| [WhiteNightsApplication.md](backend/WhiteNightsApplication.md) | `@SpringBootApplication`, точка входа |

---

### Аутентификация (`auth`)

| Файл | Описание |
|---|---|
| [AuthController.md](backend/auth/AuthController.md) | REST-эндпоинты регистрации/входа/выхода |
| [AuthService.md](backend/auth/AuthService.md) | Логика аутентификации |
| [JwtService.md](backend/auth/JwtService.md) | Генерация и валидация JWT |
| [domain/User.md](backend/auth/domain/User.md) | Сущность пользователя |
| [domain/UserRole.md](backend/auth/domain/UserRole.md) | Перечисление ролей |
| [domain/RefreshToken.md](backend/auth/domain/RefreshToken.md) | Токен обновления сессии |
| [domain/VerificationToken.md](backend/auth/domain/VerificationToken.md) | Токен подтверждения email |
| [domain/PasswordResetToken.md](backend/auth/domain/PasswordResetToken.md) | Токен сброса пароля |
| [dto/AuthResponse.md](backend/auth/dto/AuthResponse.md) | DTO ответа при входе |
| [dto/LoginRequest.md](backend/auth/dto/LoginRequest.md) | DTO запроса входа |
| [dto/RegisterRequest.md](backend/auth/dto/RegisterRequest.md) | DTO запроса регистрации |
| [dto/PasswordResetRequest.md](backend/auth/dto/PasswordResetRequest.md) | DTO запроса сброса пароля |
| [dto/ResetPassword.md](backend/auth/dto/ResetPassword.md) | DTO установки нового пароля |
| [repository/UserRepository.md](backend/auth/repository/UserRepository.md) | Репозиторий пользователей |
| [repository/RefreshTokenRepository.md](backend/auth/repository/RefreshTokenRepository.md) | Репозиторий refresh-токенов |
| [repository/VerificationTokenRepository.md](backend/auth/repository/VerificationTokenRepository.md) | Репозиторий токенов верификации |
| [repository/PasswordResetTokenRepository.md](backend/auth/repository/PasswordResetTokenRepository.md) | Репозиторий токенов сброса пароля |

---

### Общие компоненты (`common`)

| Файл | Описание |
|---|---|
| [security/SecurityConfig.md](backend/common/security/SecurityConfig.md) | Spring Security конфигурация |
| [security/JwtAuthenticationFilter.md](backend/common/security/JwtAuthenticationFilter.md) | JWT-фильтр HTTP-запросов |
| [security/CurrentUserResolver.md](backend/common/security/CurrentUserResolver.md) | Получение текущего пользователя из Spring Security |
| [exception/GlobalExceptionHandler.md](backend/common/exception/GlobalExceptionHandler.md) | Глобальная обработка ошибок |
| [exception/types/BadRequestException.md](backend/common/exception/types/BadRequestException.md) | Исключение 400 |
| [exception/types/ForbiddenException.md](backend/common/exception/types/ForbiddenException.md) | Исключение 403 |
| [ratelimit/RateLimitingService.md](backend/common/ratelimit/RateLimitingService.md) | Rate limiting через Bucket4j |
| [storage/StorageService.md](backend/common/storage/StorageService.md) | Интерфейс хранилища файлов |
| [storage/MinioConfig.md](backend/common/storage/MinioConfig.md) | Конфигурация MinIO клиента |
| [storage/MinioStorageService.md](backend/common/storage/MinioStorageService.md) | Реализация хранилища через MinIO |
| [email/EmailService.md](backend/common/email/EmailService.md) | Интерфейс email-сервиса |
| [email/ConsoleEmailService.md](backend/common/email/ConsoleEmailService.md) | Dev-реализация (вывод в консоль) |

---

### Профиль и подписки (`user`)

| Файл | Описание |
|---|---|
| [ProfileController.md](backend/user/ProfileController.md) | Эндпоинты профиля |
| [ProfileService.md](backend/user/ProfileService.md) | Логика профиля |
| [FollowController.md](backend/user/FollowController.md) | Эндпоинты подписок |
| [FollowService.md](backend/user/FollowService.md) | Логика подписок |
| [domain/Follow.md](backend/user/domain/Follow.md) | Сущность подписки |
| [domain/FollowStatus.md](backend/user/domain/FollowStatus.md) | Статусы подписки |
| [domain/UserBlock.md](backend/user/domain/UserBlock.md) | Сущность блокировки |
| [repository/FollowRepository.md](backend/user/repository/FollowRepository.md) | Репозиторий подписок |
| [repository/UserBlockRepository.md](backend/user/repository/UserBlockRepository.md) | Репозиторий блокировок |
| [dto/UserProfileResponse.md](backend/user/dto/UserProfileResponse.md) | DTO полного профиля |
| [dto/UserSummaryResponse.md](backend/user/dto/UserSummaryResponse.md) | DTO краткой информации о пользователе |

---

### Посты и взаимодействия (`post`)

| Файл | Описание |
|---|---|
| [PostController.md](backend/post/PostController.md) | CRUD эндпоинты постов |
| [PostService.md](backend/post/PostService.md) | Логика работы с постами |
| [InteractionController.md](backend/post/InteractionController.md) | Лайки, сохранения, просмотры, комментарии |
| [InteractionService.md](backend/post/InteractionService.md) | Логика взаимодействий с постами |
| [domain/Post.md](backend/post/domain/Post.md) | Сущность поста |
| [domain/Comment.md](backend/post/domain/Comment.md) | Сущность комментария |
| [domain/Like.md](backend/post/domain/Like.md) | Лайки, сохранения, просмотры |
| [repository/PostRepository.md](backend/post/repository/PostRepository.md) | Репозиторий постов |
| [repository/LikeRepository.md](backend/post/repository/LikeRepository.md) | Репозитории лайков, сохранений, просмотров |
| [repository/CommentRepository.md](backend/post/repository/CommentRepository.md) | Репозиторий комментариев |
| [dto/CreatePostRequest.md](backend/post/dto/CreatePostRequest.md) | DTO создания и обновления поста |
| [dto/PostSummaryResponse.md](backend/post/dto/PostSummaryResponse.md) | DTO поста, комментария |

---

### Лента (`feed`)

| Файл | Описание |
|---|---|
| [FeedController.md](backend/feed/FeedController.md) | Эндпоинт ленты |
| [FeedService.md](backend/feed/FeedService.md) | Read-time алгоритм ленты |

---

### Теги (`tag`)

| Файл | Описание |
|---|---|
| [Tag.md](backend/tag/Tag.md) | Сущность тега, репозиторий, DTO |
| [TagController.md](backend/tag/TagController.md) | Эндпоинты тегов |
| [TagService.md](backend/tag/TagService.md) | Логика поиска и создания тегов |

---

### Поиск (`search`)

| Файл | Описание |
|---|---|
| [SearchController.md](backend/search/SearchController.md) | Эндпоинты поиска |
| [SearchService.md](backend/search/SearchService.md) | Полнотекстовый поиск (tsvector + trigram) |

---

### Книжные полки (`bookshelf`)

| Файл | Описание |
|---|---|
| [domain.md](backend/bookshelf/domain.md) | Shelf, Book, BooksOnShelf |
| [BookshelfController.md](backend/bookshelf/BookshelfController.md) | Эндпоинты полок |
| [BookshelfService.md](backend/bookshelf/BookshelfService.md) | Логика полок, перемещение книг |
| [repositories.md](backend/bookshelf/repositories.md) | ShelfRepository, BooksOnShelfRepository |

---

### Трекер чтения (`tracker`)

| Файл | Описание |
|---|---|
| [Tracker.md](backend/tracker/Tracker.md) | TrackerEntry, контроллер, сервис, репозиторий |

---

### Чат (`chat`)

| Файл | Описание |
|---|---|
| [domain.md](backend/chat/domain.md) | Chat, ChatMember, Message, ChatMemberRole |
| [ChatWebSocket.md](backend/chat/ChatWebSocket.md) | WebSocket конфигурация, аутентификация, контроллер |
| [ChatService.md](backend/chat/ChatService.md) | Логика чатов и сообщений |
| [ChatController.md](backend/chat/ChatController.md) | REST эндпоинты чатов |

---

### Модерация (`moderation`)

| Файл | Описание |
|---|---|
| [Moderation.md](backend/moderation/Moderation.md) | Report, контроллер, сервис |

---

### Администрирование (`admin`)

| Файл | Описание |
|---|---|
| [Admin.md](backend/admin/Admin.md) | Роли, баны, аудит, статистика |

---

### Настройки пользователя (`settings`)

| Файл | Описание |
|---|---|
| [Settings.md](backend/settings/Settings.md) | Сохранённые посты, смена пароля, удаление аккаунта |

---

### Поддержка (`support`)

| Файл | Описание |
|---|---|
| [Support.md](backend/support/Support.md) | Обращения в поддержку |

---

## Фронтенд

### Точка входа и роутинг

| Файл | Описание |
|---|---|
| [main.md](frontend/main.md) | `main.tsx` — StrictMode, BrowserRouter, QueryClientProvider |
| [App.md](frontend/App.md) | `App.tsx` — роутинг, AppShell, AuthShell, защищённые маршруты |

---

### Shared-компоненты

| Файл | Описание |
|---|---|
| [shared/api.md](frontend/shared/api.md) | Axios клиент, JWT-интерсептор, обработка 401 |
| [shared/stores.md](frontend/shared/stores.md) | Zustand: useAuthStore, useUnreadStore |
| [shared/components.md](frontend/shared/components.md) | Avatar, PostCard |
| [shared/hooks-i18n.md](frontend/shared/hooks-i18n.md) | useCursorPagination, i18n конфигурация |

---

### Features

| Файл | Описание |
|---|---|
| [features/auth.md](frontend/features/auth.md) | LoginPage, RegisterPage, VerifyPage, ForgotPasswordPage, ResetPasswordPage |
| [features/pages.md](frontend/features/pages.md) | FeedPage, PostPage, TrackerPage |
| [features/profile-pages.md](frontend/features/profile-pages.md) | ProfilePage, EditProfileModal, FollowRequestsModal, FollowersModal |
| [features/chat-page.md](frontend/features/chat-page.md) | ChatsPage, ChatView, GroupInfoModal |
| [features/search-shelves-tag-pages.md](frontend/features/search-shelves-tag-pages.md) | SearchPage, ShelvesPage, TagPage |
| [features/settings-page.md](frontend/features/settings-page.md) | SettingsPage (4 вкладки) |
| [features/moderation-admin-pages.md](frontend/features/moderation-admin-pages.md) | ModerationPage, StatisticsPage, SupportPage (admin) |
| [features/post-modals.md](frontend/features/post-modals.md) | CreatePostModal, EditPostModal, ReportModal |
| [features/post-hooks.md](frontend/features/post-hooks.md) | useInteractions, usePostMutations, useComments |
| [features/profile-hooks.md](frontend/features/profile-hooks.md) | useProfile, useUploadAvatar, useUpdateProfile |
| [features/chat-hooks.md](frontend/features/chat-hooks.md) | useChatSocket, useChats, useMessages |
| [features/other-hooks.md](frontend/features/other-hooks.md) | useFollow, useMonthlyPages, useSearch, useAdminStats, useModeration |
