# ConsoleEmailService

## Назначение

Реализация `EmailService` для разработки. Вместо настоящей отправки писем выводит содержимое в консоль через логгер и `System.out`. Токены верификации видны прямо в терминале, где запущен бэкенд.

## Полный разбор кода

```java
@Service
@Slf4j
public class ConsoleEmailService implements EmailService {

    @Override
    public void sendVerificationEmail(String email, String token) {
        log.info("Sending verification email to {}: token = {}", email, token);
        System.out.println("--------------------------------------------------");
        System.out.println("VERIFICATION EMAIL");
        System.out.println("To: " + email);
        System.out.println("Verify here: http://localhost:5173/verify?token=" + token);
        System.out.println("--------------------------------------------------");
    }

    @Override
    public void sendPasswordResetEmail(String email, String token) {
        log.info("Sending password reset email to {}: token = {}", email, token);
    }

    @Override
    public void sendSupportMessage(String fromEmail, String subject, String message) {
        log.info("Support message from {}: subject = {}", fromEmail, subject);
        System.out.println("--------------------------------------------------");
        System.out.println("SUPPORT MESSAGE");
        System.out.println("From: " + fromEmail);
        System.out.println("Subject: " + subject);
        System.out.println("Message: " + message);
        System.out.println("--------------------------------------------------");
    }
}
```

### Построчный разбор

**`@Slf4j`**
Автоматически создаёт логгер. `log.info("...", email, token)` — записывает в лог-файл/консоль в стандартном формате с временной меткой и уровнем INFO.

**`System.out.println`**
Стандартный вывод в консоль — дополнительный, более заметный вывод для разработчика. В продакшене такой код убирают — `log.info` достаточно.

**`http://localhost:5173/verify?token=`**
Жёстко зашитый URL локального фронтенда. В продакшене это должен быть реальный URL сайта, считанный из конфигурации.

**Как использовать при разработке:**
1. Зарегистрировать пользователя через API
2. Найти в консоли строку `Verify here: http://localhost:5173/verify?token=...`
3. Открыть URL в браузере — email подтверждён
