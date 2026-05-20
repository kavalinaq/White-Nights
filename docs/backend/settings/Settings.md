# SettingsController, SettingsService

## Назначение

Настройки аккаунта пользователя: список сохранённых постов, смена пароля, отправка обращения в поддержку, удаление аккаунта.

## Полный разбор кода

```java
@RestController
public class SettingsController {

    @GetMapping("/api/users/me/saved")
    public List<PostSummaryResponse> getSavedPosts(@RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int limit, ...) {
        return settingsService.getSavedPosts(user, cursor, limit);
    }

    @PostMapping("/api/users/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@RequestBody @Valid ChangePasswordRequest request, ...) {
        settingsService.changePassword(user, request.currentPassword(), request.newPassword());
    }

    @PostMapping("/api/support")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void sendSupport(@RequestBody @Valid SupportRequest request, ...) {
        settingsService.sendSupportMessage(user, request.subject(), request.message());
    }

    @DeleteMapping("/api/users/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAccount(...) {
        settingsService.deleteAccount(user);
    }
}
```

```java
@Service
public class SettingsService {

    public List<PostSummaryResponse> getSavedPosts(User user, Long cursor, int limit) {
        List<PostSummaryHelper> helpers = interactionService.getSavedPosts(user.getUserId(), cursor, limit);
        // batch-проверка лайков
        return posts.stream()
                .map(p -> postService.toSummary(p, likedIds.contains(p.getPostId()), true))
                .toList();
    }

    @Transactional
    public void changePassword(User user, String currentPassword, String newPassword) {
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new UnauthorizedException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        refreshTokenRepository.deleteByUser(user);
    }

    @Transactional
    public void deleteAccount(User user) {
        refreshTokenRepository.deleteByUser(user);
        userRepository.delete(user);
    }
}
```

### Построчный разбор

**`getSavedPosts` — третий аргумент `true`**
`postService.toSummary(p, likedIds.contains(p.getPostId()), true)` — третий аргумент `saved = true` всегда. В списке сохранённых постов все посты по определению сохранены текущим пользователем.

**`changePassword` — инвалидация сессий**
После смены пароля все refresh tokens пользователя удаляются. Это принудительно разлогинит пользователя со всех других устройств. Текущая сессия продолжает работать, пока не истечёт access token.

**`passwordEncoder.matches(currentPassword, user.getPasswordHash())`**
BCrypt не хранит пароль открытым текстом — только хеш. `matches` хеширует введённый пароль и сравнивает с хранимым хешем. Никогда нельзя расшифровать `getPasswordHash()` обратно в пароль.

**`deleteAccount`**
Удаляются токены (выход со всех устройств) и сам аккаунт. Cascade на уровне БД удаляет все связанные данные пользователя (посты, комментарии и т.д. — зависит от схемы).
