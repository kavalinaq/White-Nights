# ForbiddenException / UnauthorizedException / TooManyRequestsException / StorageException

## Назначение

Оставшиеся типы кастомных исключений проекта. Документация по всем типам объединена — см. `BadRequestException.md` для полного списка и объяснения паттерна.

## ForbiddenException → HTTP 403

```java
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) { super(message); }
}
```
Пользователь аутентифицирован, но не имеет прав. Пример: попытка отредактировать чужой пост.

## UnauthorizedException → HTTP 401

```java
@ResponseStatus(HttpStatus.UNAUTHORIZED)
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) { super(message); }
}
```
Пользователь не аутентифицирован или учётные данные неверны. Пример: неверный пароль.

## TooManyRequestsException → HTTP 429

```java
@ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
public class TooManyRequestsException extends RuntimeException {
    public TooManyRequestsException(String message) { super(message); }
}
```
Превышен лимит запросов. Выбрасывается `AuthController` после проверки `RateLimitingService`.

## StorageException → HTTP 500

```java
@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class StorageException extends RuntimeException {
    public StorageException(String message, Throwable cause) {
        super(message, cause);
    }
}
```
Ошибка MinIO. Принимает `Throwable cause` — оригинальное исключение MinIO сохраняется как причина для диагностики в логах. `super(message, cause)` передаёт оба аргумента в `RuntimeException`.
