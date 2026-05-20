# User

## Назначение

JPA-сущность, представляющая пользователя системы. Каждый экземпляр этого класса соответствует одной строке в таблице `users` базы данных. Содержит все данные профиля: никнейм, email, хэш пароля, роль, статусы блокировки/верификации/приватности, биографию и URL аватара.

## Полный разбор кода

```java
@Entity
@Table(name = "\"users\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(unique = true, nullable = false, length = 50)
    private String nickname;

    @Column(unique = true, nullable = false, length = 255)
    private String email;

    @Column(nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserRole role = UserRole.user;

    @Column(nullable = false)
    @Builder.Default
    private boolean isBlocked = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean isVerified = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean isPrivate = false;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(length = 255)
    private String avatarUrl;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

### Построчный разбор

**`@Entity`**
Сообщает JPA (Hibernate), что этот Java-класс соответствует таблице в базе данных. Hibernate будет автоматически преобразовывать объекты класса в строки таблицы и обратно.

**`@Table(name = "\"users\"")`**
Явно задаёт имя таблицы. Кавычки вокруг `users` нужны потому, что `users` — зарезервированное слово в PostgreSQL. Двойные кавычки внутри строки Java экранируются обратным слешем: `\"`.

**`@Getter` / `@Setter`**
Аннотации Lombok. Во время компиляции автоматически генерируют методы `getUserId()`, `setUserId()`, `getNickname()`, `setNickname()` и т.д. для всех полей. Без Lombok пришлось бы писать эти методы вручную.

**`@NoArgsConstructor`**
Lombok генерирует конструктор без аргументов: `new User()`. JPA требует его наличия для восстановления объектов из БД.

**`@AllArgsConstructor`**
Lombok генерирует конструктор со всеми полями. Нужен для паттерна Builder в Lombok.

**`@Builder`**
Lombok генерирует класс-строитель. Позволяет создавать объекты так:
```java
User user = User.builder()
    .nickname("alice")
    .email("alice@example.com")
    .passwordHash("hash")
    .build();
```
Это удобнее конструктора с 10+ параметрами.

**`@Id`**
Помечает поле как первичный ключ таблицы.

**`@GeneratedValue(strategy = GenerationType.IDENTITY)`**
Значение первичного ключа генерирует БД (PostgreSQL использует `SERIAL` или `BIGSERIAL`). При каждой вставке строки PostgreSQL автоматически увеличивает счётчик.

**`@Column(unique = true, nullable = false, length = 50)`**
Описывает ограничения столбца в БД:
- `unique = true` → уникальный индекс, не может быть двух пользователей с одинаковым никнеймом
- `nullable = false` → столбец NOT NULL
- `length = 50` → максимальная длина строки (VARCHAR(50))

**`@Enumerated(EnumType.STRING)`**
Говорит Hibernate хранить enum как строку (`"user"`, `"moderator"`, `"admin"`), а не как число. Числовой способ (`EnumType.ORDINAL`) опасен: если добавить новое значение в середину enum, старые данные станут некорректными.

**`@Builder.Default`**
При использовании Builder Lombok по умолчанию игнорирует инициализаторы полей. `@Builder.Default` восстанавливает это поведение: если при создании объекта через Builder не указать `role`, оно будет `UserRole.user`.

**`@Column(columnDefinition = "TEXT")`**
Создаёт столбец типа TEXT в PostgreSQL (неограниченная длина строки), вместо VARCHAR с фиксированным лимитом.

**`@CreationTimestamp`**
Аннотация Hibernate. Автоматически устанавливает текущее время при первом сохранении объекта. Не нужно устанавливать `createdAt` вручную.

**`@Column(nullable = false, updatable = false)`**
`updatable = false` — Hibernate не будет включать этот столбец в UPDATE-запросы. Дата создания не должна меняться после создания записи.
