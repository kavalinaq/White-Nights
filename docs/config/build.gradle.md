# build.gradle (backend)

## Назначение

Файл сборки Gradle для бэкенда. Объявляет зависимости проекта, версии плагинов и настройки компилятора Java. Gradle читает этот файл и автоматически скачивает все нужные библиотеки из интернета (Maven Central).

## Полный разбор кода

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.5.5'
    id 'io.spring.dependency-management' version '1.1.7'
}

group = 'com.whitenights'
version = '0.0.1-SNAPSHOT'

java {
    sourceCompatibility = '25'
}

configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-websocket'
    implementation 'org.flywaydb:flyway-core'
    runtimeOnly 'org.flywaydb:flyway-database-postgresql'
    
    compileOnly 'org.projectlombok:lombok:1.18.44'
    annotationProcessor 'org.projectlombok:lombok:1.18.44'
    
    runtimeOnly 'org.postgresql:postgresql'
    
    implementation 'com.bucket4j:bucket4j-core:8.10.1'
    implementation 'io.minio:minio:8.5.17'
    
    implementation 'io.jsonwebtoken:jjwt-api:0.12.5'
    runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.12.5'
    runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.12.5'

    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.boot:spring-boot-test-autoconfigure'
    testImplementation 'org.springframework.security:spring-security-test'
    testImplementation 'org.testcontainers:junit-jupiter'
    testImplementation 'org.testcontainers:postgresql'
}

dependencyManagement {
    imports {
        mavenBom 'org.testcontainers:testcontainers-bom:1.19.7'
    }
}

tasks.named('test') {
    useJUnitPlatform()
}
```

### Построчный разбор

**`plugins { ... }`**
Подключаемые плагины:
- `'java'` — базовая поддержка Java: компиляция, тесты, jar
- `'org.springframework.boot'` — позволяет запускать приложение командой `./gradlew bootRun` и собирать исполняемый jar
- `'io.spring.dependency-management'` — управляет версиями зависимостей Spring, чтобы не указывать их вручную

**`group = 'com.whitenights'`**
Идентификатор организации в мире Maven/Gradle. Используется как часть имени артефакта.

**`version = '0.0.1-SNAPSHOT'`**
`SNAPSHOT` означает «в разработке», не релизная версия.

**`sourceCompatibility = '25'`**
Код компилируется под Java 25. Нужно, чтобы Java, установленная на машине, была не ниже 25 версии.

**`configurations { compileOnly { extendsFrom annotationProcessor } }`**
Это нужно для Lombok: его аннотации обрабатываются только во время компиляции (не попадают в финальный jar). `extendsFrom` означает «возьми все библиотеки из `annotationProcessor` и добавь их в `compileOnly`».

**`repositories { mavenCentral() }`**
Gradle будет искать и скачивать библиотеки с центрального репозитория Maven (https://search.maven.org).

**`implementation 'org.springframework.boot:spring-boot-starter-data-jpa'`**
Добавляет Spring Data JPA + Hibernate для работы с базой данных через Java-объекты.

**`spring-boot-starter-security`**
Spring Security — фильтры аутентификации, авторизации, CSRF-защита.

**`spring-boot-starter-validation`**
Аннотации Bean Validation: `@NotBlank`, `@Email`, `@Size` и т.д.

**`spring-boot-starter-web`**
Встроенный сервер Tomcat + Spring MVC для REST API.

**`spring-boot-starter-websocket`**
Поддержка WebSocket и STOMP для чата.

**`org.flywaydb:flyway-core`**
Flyway — инструмент миграции БД. Применяет SQL-скрипты из `db/migration/` в нужном порядке.

**`compileOnly 'org.projectlombok:lombok:1.18.44'`**
Lombok генерирует геттеры, сеттеры, конструкторы во время компиляции. `compileOnly` — значит в финальный jar не включается.

**`runtimeOnly 'org.postgresql:postgresql'`**
JDBC-драйвер PostgreSQL. Нужен только во время выполнения программы, не при компиляции.

**`com.bucket4j:bucket4j-core:8.10.1`**
Библиотека для ограничения частоты запросов (rate limiting). Реализует алгоритм «token bucket».

**`io.minio:minio:8.5.17`**
Клиент MinIO для загрузки/скачивания файлов.

**`io.jsonwebtoken:jjwt-api`** + **`jjwt-impl`** + **`jjwt-jackson`**
Библиотека для работы с JWT токенами. Разделена на три модуля: API (интерфейсы), реализация, сериализация через Jackson.

**`testImplementation 'org.testcontainers:postgresql'`**
Testcontainers запускает реальный PostgreSQL в Docker во время тестов. Это надёжнее, чем мок-база данных.

**`dependencyManagement { imports { mavenBom ... } }`**
BOM (Bill of Materials) — файл, который фиксирует согласованные версии всех модулей Testcontainers. Без него разные модули могут конфликтовать.

**`tasks.named('test') { useJUnitPlatform() }`**
Говорит Gradle запускать тесты через JUnit 5 (Jupiter).
