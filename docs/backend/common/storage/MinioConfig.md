# MinioConfig

## Назначение

Конфигурационный класс, создающий бин `MinioClient` — клиент для работы с MinIO. Spring внедряет этот клиент во все компоненты, которым нужно загружать или скачивать файлы.

## Полный разбор кода

```java
@Configuration
public class MinioConfig {

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
    }
}
```

### Построчный разбор

**`@Configuration`**
Класс содержит определения бинов Spring. Методы с `@Bean` вызываются при старте и их результат регистрируется как управляемый объект.

**`@Value("${minio.endpoint}")`**
Читает значение из `application.yml`: `minio.endpoint: http://localhost:9000`. Spring подставляет его в поле при создании класса.

**`MinioClient.builder()`**
Паттерн Builder. `MinioClient` — официальная клиентская библиотека MinIO (совместима с Amazon S3 API). Настраивается адресом сервера и учётными данными.

**`.credentials(accessKey, secretKey)`**
MinIO использует пару ключей, аналогичную Amazon AWS. `minioadmin` / `minioadmin` — дефолтные для локальной разработки.

**Результат:** `MinioClient` доступен для внедрения в любой Spring-компонент через `@Autowired` или конструктор.
