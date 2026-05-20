# MinioStorageService

## Назначение

Реализация `StorageService` для MinIO. Загружает файлы в указанную корзину, автоматически создаёт корзину при необходимости, настраивает публичный доступ к файлам и возвращает публичный URL. При ошибке выбрасывает `StorageException`.

## Полный разбор кода

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class MinioStorageService implements StorageService {

    private final MinioClient minioClient;

    @Value("${minio.endpoint}")
    private String endpoint;

    @Override
    public String uploadFile(String bucket, String filename, MultipartFile file) {
        try {
            boolean found = minioClient.bucketExists(
                BucketExistsArgs.builder().bucket(bucket).build()
            );
            if (!found) {
                minioClient.makeBucket(
                    MakeBucketArgs.builder().bucket(bucket).build()
                );
            }

            String policy = """
                {"Version":"2012-10-17","Statement":[{
                    "Effect":"Allow",
                    "Principal":{"AWS":["*"]},
                    "Action":["s3:GetObject"],
                    "Resource":["arn:aws:s3:::""" + bucket + """/*"]}]}
                """;
            minioClient.setBucketPolicy(
                SetBucketPolicyArgs.builder().bucket(bucket).config(policy).build()
            );

            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(filename)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build()
            );

            return endpoint + "/" + bucket + "/" + filename;
        } catch (Exception e) {
            log.error("Error uploading file to MinIO bucket={} filename={}", bucket, filename, e);
            throw new StorageException("Failed to upload file to storage", e);
        }
    }

    @Override
    public void deleteFile(String bucket, String filename) {
        try {
            minioClient.removeObject(
                RemoveObjectArgs.builder().bucket(bucket).object(filename).build()
            );
        } catch (Exception e) {
            log.error("Error deleting file from MinIO bucket={} filename={}", bucket, filename, e);
        }
    }
}
```

### Построчный разбор

**`@Slf4j`**
Аннотация Lombok, генерирующая поле `private static final Logger log = LoggerFactory.getLogger(MinioStorageService.class)`. Позволяет использовать `log.info(...)`, `log.error(...)` без объявления логгера вручную.

**`implements StorageService`**
Класс реализует интерфейс. Все методы интерфейса должны быть реализованы (иначе ошибка компиляции). `@Override` подтверждает, что метод переопределяет интерфейсный.

**`minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build())`**
MinIO API использует объекты-аргументы (Args) вместо множества параметров. `BucketExistsArgs.builder().bucket(bucket).build()` создаёт объект запроса «проверить существование корзины с именем `bucket`».

**`minioClient.makeBucket(...)`**
Создаёт корзину, если её нет. MinIO требует, чтобы корзина существовала перед загрузкой файла. Три корзины (`avatars`, `posts`, `chat`) создаются автоматически при первой загрузке.

**JSON-политика `s3:GetObject` для `"*"`**
Делает все файлы в корзине публично доступными через HTTP GET. Это AWS S3-совместимая политика доступа. `"Principal": {"AWS": ["*"]}` — любой пользователь. `"Action": ["s3:GetObject"]` — только чтение (не запись). `"Resource": ["arn:aws:s3:::avatars/*"]` — все объекты в корзине. Без этой политики файлы были бы доступны только с авторизацией.

**`file.getInputStream()`**
`MultipartFile` — загруженный файл в памяти. `getInputStream()` открывает поток байт для чтения. MinIO читает файл потоком, не копируя его целиком в память.

**`file.getSize(), -1`**
Второй аргумент — размер объекта (известен точно). Третий — размер части при multipart-загрузке; `-1` означает «не делить на части».

**`file.getContentType()`**
MIME-тип файла, например `"image/jpeg"`. MinIO сохраняет его, чтобы браузер мог правильно отображать файл.

**`endpoint + "/" + bucket + "/" + filename`**
Формирует публичный URL: `http://localhost:9000/avatars/abc123.jpg`. Этот URL сохраняется в БД и возвращается клиенту.

**`log.error("...", bucket, filename, e)`**
Форматированный лог с контекстом ошибки. `{}` — плейсхолдеры SLF4J. Последний аргумент `e` добавляет stack trace в лог.

**В `deleteFile` ошибка поглощается (только лог)**
Удаление файла — некритичная операция. Если файл уже удалён из MinIO, ошибка не должна ронять запрос. Поэтому здесь только лог, без `throw`.
