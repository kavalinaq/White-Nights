# docker-compose.yml

## Назначение

Файл описывает локальную инфраструктуру проекта: запускает базу данных PostgreSQL и хранилище файлов MinIO с помощью Docker. Достаточно одной команды `docker-compose up -d`, чтобы поднять всё необходимое окружение для разработки.

## Полный разбор кода

```yaml
services:
  db:
    image: postgres:15-alpine
    container_name: white-nights-db
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: whitenights
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  minio:
    image: minio/minio
    container_name: white-nights-storage
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
```

### Построчный разбор

**`services:`**
Верхний уровень конфигурации Docker Compose. Здесь перечисляются все контейнеры, которые нужно запустить.

**`image: postgres:15-alpine`**
Используется официальный образ PostgreSQL версии 15, собранный на основе Alpine Linux (минимальная операционная система, образ весит ~50 МБ вместо ~200 МБ).

**`container_name: white-nights-db`**
Присваивает контейнеру имя. Без этого Docker придумал бы случайное имя типа `festive_curie`.

**`environment:`**
Переменные окружения, которые передаются внутрь контейнера. PostgreSQL использует их для первоначальной настройки при первом запуске:
- `POSTGRES_USER` — имя суперпользователя БД
- `POSTGRES_PASSWORD` — его пароль  
- `POSTGRES_DB` — имя базы данных, которую создать автоматически

**`ports: - "5432:5432"`**
Пробрасывает порт из контейнера на машину разработчика. Формат: `"порт_на_хосте:порт_в_контейнере"`. PostgreSQL по умолчанию слушает порт 5432. После этого с локальной машины можно подключиться через `localhost:5432`.

**`volumes: - postgres_data:/var/lib/postgresql/data`**
Данные базы хранятся в именованном томе `postgres_data`, а не внутри контейнера. Это значит, что при перезапуске или пересоздании контейнера данные не потеряются. `/var/lib/postgresql/data` — это папка внутри контейнера, где PostgreSQL хранит файлы БД.

**`image: minio/minio`**
MinIO — объектное хранилище, совместимое с Amazon S3. Используется для хранения аватаров, изображений постов и вложений в чате.

**`ports: - "9000:9000"` и `- "9001:9001"`**
Порт 9000 — API для загрузки и скачивания файлов (S3-совместимый). Порт 9001 — веб-консоль администратора MinIO, открывается в браузере.

**`command: server /data --console-address ":9001"`**
Команда запуска MinIO: запустить сервер, хранить данные в `/data`, веб-консоль запустить на порту 9001.

**`volumes:`** (в конце файла)
Объявляет именованные тома. Docker управляет ими отдельно от контейнеров — данные живут до тех пор, пока том не удалён явно командой `docker volume rm`.
