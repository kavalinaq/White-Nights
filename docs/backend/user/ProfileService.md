# ProfileService

## Назначение

Сервис для работы с профилями пользователей. Реализует получение профиля с учётом приватности и статуса подписки, обновление профиля, управление аватаром через MinIO.

## Полный разбор кода

```java
@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final FollowRepository followRepository;
    private final UserBlockRepository userBlockRepository;
    private final StorageService storageService;

    @Value("${minio.bucket}")
    private String avatarBucket;

    public UserProfileResponse getProfile(String nickname, User currentUser) {
        User user = userRepository.findByNickname(nickname)
            .orElseThrow(() -> new NotFoundException("User not found"));

        boolean isSelf = currentUser != null && currentUser.getUserId().equals(user.getUserId());

        String followStatus = "none";
        boolean isBlocked = false;
        if (currentUser != null && !isSelf) {
            followStatus = followRepository.findByFollowerAndFollowee(currentUser, user)
                .map(f -> f.getStatus().name())
                .orElse("none");
            isBlocked = userBlockRepository.existsById(
                new UserBlock.UserBlockId(currentUser.getUserId(), user.getUserId()));
        }

        long followingCount = followRepository.countByFollowerAndStatus(user, FollowStatus.accepted);
        long followerCount = followRepository.countByFolloweeAndStatus(user, FollowStatus.accepted);

        boolean isFollower = "accepted".equals(followStatus);

        if (user.isPrivate() && !isSelf && !isFollower) {
            // Возвращаем ограниченный профиль
            return UserProfileResponse.builder()
                .userId(user.getUserId())
                .nickname(user.getNickname())
                // ... минимальные поля
                .isPrivate(true)
                .build();
        }

        return UserProfileResponse.builder()
            .userId(user.getUserId())
            .email(isSelf ? user.getEmail() : null) // Email только себе
            .build();
    }

    @Transactional
    public String uploadAvatar(MultipartFile file, User currentUser) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Only image files are allowed");
        }

        if (currentUser.getAvatarUrl() != null) {
            String oldFilename = currentUser.getAvatarUrl()
                .substring(currentUser.getAvatarUrl().lastIndexOf("/") + 1);
            storageService.deleteFile(avatarBucket, oldFilename);
        }

        String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        String url = storageService.uploadFile(avatarBucket, filename, file);

        currentUser.setAvatarUrl(url);
        userRepository.save(currentUser);
        return url;
    }
}
```

### Построчный разбор

**`boolean isSelf = currentUser != null && currentUser.getUserId().equals(user.getUserId())`**
Проверяет, смотрит ли пользователь свой профиль. Короткое замыкание (`&&`): если `currentUser == null`, второй операнд не вычисляется — нет `NullPointerException`.

**`followRepository.findByFollowerAndFollowee(currentUser, user).map(f -> f.getStatus().name()).orElse("none")`**
Цепочка Optional: находим связь подписки → если есть, берём имя статуса (`"accepted"`, `"pending"`) → если нет — `"none"`.

**`userBlockRepository.existsById(new UserBlock.UserBlockId(...))`**
Создаёт составной ключ блокировки (кто заблокировал, кого) и проверяет наличие записи.

**Приватный профиль:** если `user.isPrivate() && !isSelf && !isFollower` — возвращаем только базовые данные (никнейм, аватар, счётчики). Посты и email не видны.

**`email(isSelf ? user.getEmail() : null)`**
Email видят только сами пользователи — защита приватности. Если смотришь чужой профиль, поле `email` в ответе будет `null`.

**`currentUser.getAvatarUrl().substring(currentUser.getAvatarUrl().lastIndexOf("/") + 1)`**
Извлекает имя файла из URL: `http://localhost:9000/avatars/abc123.jpg` → `abc123.jpg`. `lastIndexOf("/") + 1` — позиция первого символа после последнего слеша.

**`UUID.randomUUID().toString() + "_" + file.getOriginalFilename()`**
Имя файла в MinIO: UUID + оригинальное имя. UUID гарантирует уникальность — два пользователя могут загрузить файл с одинаковым именем без конфликта. Пример: `550e8400-e29b-41d4-a716-446655440000_photo.jpg`.
