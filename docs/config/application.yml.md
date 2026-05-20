# application.yml (backend)

## Назначение

Главный конфигурационный файл Spring Boot приложения. Содержит настройки подключения к базе данных, MinIO, JWT-токенов, загрузки файлов и логирования. Spring Boot автоматически читает этот файл при старте.

## Полный разбор кода

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 20MB
  datasource:
    url: jdbc:postgresql://localhost:5432/whitenights?stringtype=unspecified
    username: user
    password: password
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
  flyway:
    enabled: true
    locations: classpath:db/migration

server:
  port: 8080
  error:
    include-message: always
    include-binding-errors: always

logging:
  level:
    com.whitenights: DEBUG
    org.springframework.security: DEBUG

auth:
  jwt:
    secret: "v9y$B&E)H@McQfTjWnZr4u7x!A%D*G-KaPdSgUkXp2s5v8y/B?E(H+MbQeThWmYq"
    access-expiration-ms: 900000
    refresh-expiration-ms: 1209600000

minio:
  endpoint: http://localhost:9000
  access-key: minioadmin
  secret-key: minioadmin
  bucket: avatars
  posts-bucket: posts
  chat-bucket: chat

support:
  email: support@whitenights.local
```

### Построчный разбор

**`spring.servlet.multipart.max-file-size: 10MB`**
Максимальный размер одного загружаемого файла. Без этого Spring по умолчанию ограничивает загрузки до 1 МБ.

**`spring.servlet.multipart.max-request-size: 20MB`**
Максимальный размер всего HTTP-запроса (файл + поля формы).

**`datasource.url: jdbc:postgresql://localhost:5432/whitenights?stringtype=unspecified`**
Строка подключения к PostgreSQL. `stringtype=unspecified` — параметр драйвера, который говорит PostgreSQL не пытаться угадать тип строковых параметров. Это нужно для правильной работы с tsvector (полнотекстовый поиск).

**`jpa.hibernate.ddl-auto: validate`**
Hibernate не создаёт и не изменяет таблицы — только проверяет, что схема в БД соответствует Java-сущностям. Если есть расхождение, приложение не запустится. Схемой управляет Flyway.

**`hibernate.dialect: org.hibernate.dialect.PostgreSQLDialect`**
Сообщает Hibernate, что используется именно PostgreSQL. Это нужно для генерации правильного SQL (у каждой БД свой диалект).

**`flyway.enabled: true`**
Включает Flyway. При каждом запуске приложения Flyway проверяет, какие миграции ещё не применены, и выполняет их.

**`flyway.locations: classpath:db/migration`**
Путь к папке с SQL-миграциями. `classpath:` означает, что папка находится внутри jar-файла (в `src/main/resources`).

**`server.port: 8080`**
Порт, на котором запустится встроенный Tomcat.

**`server.error.include-message: always`**
Включает сообщения об ошибках в HTTP-ответы. В продакшене это обычно выключают, чтобы не раскрывать внутренние детали.

**`server.error.include-binding-errors: always`**
Включает детали ошибок валидации (`@Valid`) в HTTP-ответы.

**`logging.level.com.whitenights: DEBUG`**
Устанавливает уровень логирования для всего кода проекта на DEBUG. В консоли будут видны все отладочные сообщения.

**`auth.jwt.secret`**
Секретный ключ для подписи JWT токенов. В продакшене должен быть случайным и храниться в секрете (переменная окружения, Vault и т.п.), а не в файле конфигурации.

**`auth.jwt.access-expiration-ms: 900000`**
Время жизни access-токена: 900 000 мс = 15 минут. Короткое время — если токен украдут, он быстро устареет.

**`auth.jwt.refresh-expiration-ms: 1209600000`**
Время жизни refresh-токена: 1 209 600 000 мс = 14 дней. Хранится в httpOnly cookie.

**`minio.endpoint: http://localhost:9000`**
Адрес MinIO сервера. В продакшене это был бы URL облачного хранилища.

**`minio.bucket`, `minio.posts-bucket`, `minio.chat-bucket`**
Имена корзин (buckets) в MinIO для разных типов файлов: аватары, изображения постов, файлы в чате.

**`support.email`**
Email адрес поддержки — используется как адрес получателя при отправке сообщений в поддержку.
