# StorageService

## Назначение

Интерфейс для работы с файловым хранилищем. Определяет контракт загрузки и удаления файлов. Реальная реализация — `MinioStorageService`. Использование интерфейса позволяет легко заменить хранилище (например, на Amazon S3) без изменения остального кода.

## Полный разбор кода

```java
public interface StorageService {
    String uploadFile(String bucket, String filename, MultipartFile file);
    void deleteFile(String bucket, String filename);
}
```

### Построчный разбор

**`interface`**
Контракт без реализации. Классы, которые хотят быть «сервисом хранения», должны реализовать эти два метода. Spring внедряет конкретную реализацию (`MinioStorageService`) через Dependency Injection.

**`String uploadFile(String bucket, String filename, MultipartFile file)`**
- `bucket` — имя корзины в MinIO: `"avatars"`, `"posts"`, `"chat"`
- `filename` — имя файла в хранилище (обычно уникальный UUID)
- `MultipartFile file` — загруженный файл из HTTP multipart-запроса (Spring автоматически создаёт этот объект)
- Возвращает публичный URL файла: `http://localhost:9000/avatars/abc123.jpg`

**`void deleteFile(String bucket, String filename)`**
Удаляет файл. Вызывается при удалении поста с изображением или замене аватара.
