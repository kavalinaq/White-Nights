# RegisterRequest

## Назначение

DTO для запроса регистрации нового пользователя. Содержит никнейм, email и пароль с валидационными ограничениями.

## Полный разбор кода

```java
public record RegisterRequest(
    @NotBlank @Size(min = 3, max = 50) String nickname,
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8) String password
) {}
```

### Построчный разбор

**`@Size(min = 3, max = 50) String nickname`**
Никнейм должен быть от 3 до 50 символов. Ограничение `max = 50` согласуется с `@Column(length = 50)` в сущности `User`.

**`@Email String email`**
Проверка формата email. Дополнительная проверка уникальности делается в `AuthService` через `userRepository.existsByEmail()`.

**`@Size(min = 8) String password`**
Минимальная длина пароля — 8 символов. Это базовое требование безопасности. Пароль никогда не сохраняется в открытом виде — в `AuthService` он сразу хэшируется через BCrypt.
