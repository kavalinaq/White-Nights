# WhiteNightsApplication

## Назначение

Точка входа всего Spring Boot приложения. Содержит метод `main`, с которого начинается выполнение программы. Spring Boot автоматически находит и настраивает все компоненты проекта.

## Полный разбор кода

```java
package com.whitenights;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WhiteNightsApplication {

    public static void main(String[] args) {
        SpringApplication.run(WhiteNightsApplication.class, args);
    }
}
```

### Построчный разбор

**`package com.whitenights;`**
Объявляет пакет — логическую группировку классов. Пакеты в Java соответствуют структуре папок: этот класс лежит в `src/main/java/com/whitenights/`.

**`@SpringBootApplication`**
Мета-аннотация, которая включает сразу три механизма:
- `@SpringBootConfiguration` — обозначает класс как источник конфигурации Spring
- `@EnableAutoConfiguration` — Spring Boot автоматически настраивает компоненты на основе зависимостей из `build.gradle` (например, видит JPA — настраивает Hibernate)
- `@ComponentScan` — Spring сканирует все классы в пакете `com.whitenights` и его подпакетах, находит `@Service`, `@Controller`, `@Repository` и создаёт из них бины (управляемые объекты)

**`SpringApplication.run(WhiteNightsApplication.class, args)`**
Запускает Spring-контекст: создаёт все бины, применяет конфигурации, запускает встроенный Tomcat и начинает принимать HTTP-запросы. `args` — аргументы командной строки, которые можно передать при запуске (например, `--server.port=9090`).
