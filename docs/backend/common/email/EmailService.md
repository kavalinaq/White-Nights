# EmailService

## Назначение

Интерфейс для отправки email. Определяет три типа писем: подтверждение аккаунта, сброс пароля, и сообщение в поддержку. Реальная реализация — `ConsoleEmailService` (выводит в консоль для разработки). В продакшене подключалась бы реализация с настоящим SMTP.

## Полный разбор кода

```java
public interface EmailService {
    void sendVerificationEmail(String email, String token);
    void sendPasswordResetEmail(String email, String token);
    void sendSupportMessage(String fromEmail, String subject, String message);
}
```

### Построчный разбор

**`void sendVerificationEmail(String email, String token)`**
Отправляет письмо с токеном подтверждения. Вызывается после регистрации.

**`void sendPasswordResetEmail(String email, String token)`**
Отправляет письмо со ссылкой для сброса пароля.

**`void sendSupportMessage(String fromEmail, String subject, String message)`**
Перенаправляет сообщение в поддержку на email администраторов.

**Зачем интерфейс?**
В `AuthService` внедряется `EmailService`, а не `ConsoleEmailService`. Это значит, что для замены консольной «отправки» на настоящий SMTP (JavaMailSender) достаточно создать новую реализацию — код сервисов менять не нужно. Это принцип «Dependency Inversion» из SOLID.
