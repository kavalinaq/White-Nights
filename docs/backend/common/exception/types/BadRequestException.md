# BadRequestException (и другие типы исключений)

## Назначение

Семейство кастомных исключений проекта. Каждое исключение соответствует определённому HTTP-коду ошибки. Выбрасываются в сервисах и перехватываются `GlobalExceptionHandler`.

## Все типы исключений

### BadRequestException → HTTP 400

```java
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
```
Некорректный запрос от клиента. Пример: попытка добавить книгу, которая уже есть на полке.

---

### NotFoundException → HTTP 404

```java
@ResponseStatus(HttpStatus.NOT_FOUND)
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
```
Ресурс не найден. Пример: пост с указанным ID не существует.

---

### ConflictException → HTTP 409

```java
@ResponseStatus(HttpStatus.CONFLICT)
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
```
Конфликт состояний. Пример: регистрация с email, который уже занят.

---

### UnauthorizedException → HTTP 401

Неверные учётные данные. Пример: неверный пароль, истёкший токен.

---

### ForbiddenException → HTTP 403

Доступ запрещён. Пример: попытка удалить чужой пост.

---

### TooManyRequestsException → HTTP 429

Превышен лимит запросов (rate limiting). Пример: слишком много попыток входа.

---

### StorageException → HTTP 500

Ошибка при работе с хранилищем файлов (MinIO). Пример: ошибка загрузки файла.

## Построчный разбор

**`extends RuntimeException`**
Все исключения наследуют `RuntimeException` — «непроверяемые» исключения (unchecked). Их не нужно объявлять в сигнатуре метода через `throws`. В отличие от `Exception` (checked) — компилятор не требует их явной обработки, что удобно в Spring-сервисах.

**`super(message)`**
Передаёт сообщение в конструктор базового класса `RuntimeException` → `Exception` → `Throwable`. Сообщение доступно через `e.getMessage()` в `GlobalExceptionHandler`.

**`@ResponseStatus(HttpStatus.BAD_REQUEST)`**
Когда `GlobalExceptionHandler` отсутствует — Spring использует эту аннотацию напрямую. Но поскольку `GlobalExceptionHandler` есть, аннотация играет роль документации: сразу ясно, какой HTTP-код соответствует этому исключению.
