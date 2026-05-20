# GlobalExceptionHandler

## Назначение

Централизованный обработчик исключений для всего приложения. Перехватывает кастомные и стандартные исключения, которые выбрасываются в сервисах и контроллерах, и преобразует их в правильные HTTP-ответы с нужными кодами статуса и JSON-телом.

## Полный разбор кода

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<Map<String, String>> handleConflictException(ConflictException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, String>> handleUnauthorizedException(UnauthorizedException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(TooManyRequestsException.class)
    public ResponseEntity<Map<String, String>> handleTooManyRequestsException(TooManyRequestsException e) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<Map<String, String>> handleForbiddenException(ForbiddenException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFoundException(NotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, String>> handleBadRequestException(BadRequestException e) {
        return ResponseEntity.badRequest()
            .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDeniedException(AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(Map.of("message", "Access denied"));
    }

    @ExceptionHandler(StorageException.class)
    public ResponseEntity<Map<String, String>> handleStorageException(StorageException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException e) {
        return ResponseEntity.badRequest()
            .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException e) {
        return ResponseEntity.badRequest()
            .body(Map.of("message", e.getMessage()));
    }
}
```

### Построчный разбор

**`@ControllerAdvice`**
Аннотация Spring MVC, делающая класс «глобальным советчиком» для всех контроллеров. Методы с `@ExceptionHandler` в этом классе будут вызываться при исключениях из любого контроллера приложения — не нужно добавлять обработку в каждый контроллер отдельно.

**`@ExceptionHandler(ConflictException.class)`**
Регистрирует метод как обработчик конкретного типа исключения. Когда в любом месте приложения выбрасывается `ConflictException` — Spring вызывает этот метод.

**`ResponseEntity<Map<String, String>>`**
Оборачивает HTTP-ответ: содержит статус-код, заголовки и тело. `Map<String, String>` — тело ответа в виде словаря, который Jackson сериализует в JSON: `{"message": "Email already exists"}`.

**`ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()))`**
Цепочка builder-методов:
1. `status(HttpStatus.CONFLICT)` — устанавливает HTTP 409
2. `.body(...)` — устанавливает JSON-тело

**`Map.of("message", e.getMessage())`**
Создаёт неизменяемый словарь с одной парой. `e.getMessage()` возвращает строку, переданную в конструктор исключения: `throw new ConflictException("Email already exists")`.

**Порядок обработчиков важен:** Spring выбирает наиболее специфичный обработчик. `RuntimeException.class` — базовый класс для всех некhecked исключений, поэтому он идёт последним как «заглушка» для необработанных случаев.

**`AccessDeniedException`** — исключение Spring Security, выбрасываемое при нарушении `@PreAuthorize`. Обрабатываем отдельно, чтобы вернуть понятное сообщение вместо стандартного Spring Security ответа.
