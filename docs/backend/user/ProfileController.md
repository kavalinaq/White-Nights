# ProfileController

## Назначение

REST-контроллер для профилей пользователей. Обрабатывает запросы на `/api/users/*`: получение профиля (своего и чужого), редактирование, загрузку/удаление аватара, проверку онлайн-статуса, блокировку пользователей.

## Полный разбор кода

```java
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class ProfileController {
    // ... зависимости

    @GetMapping("/me")
    public UserProfileResponse getMyProfile(@AuthenticationPrincipal String email) {
        User user = currentUserResolver.resolve(email);
        return profileService.getProfile(user.getNickname(), user);
    }

    @GetMapping("/{nickname}")
    public UserProfileResponse getProfile(
            @PathVariable String nickname,
            @AuthenticationPrincipal String email) {
        User currentUser = null;
        if (email != null) {
            currentUser = userRepository.findByEmail(email).orElse(null);
        }
        return profileService.getProfile(nickname, currentUser);
    }

    @PatchMapping("/me")
    public UserProfileResponse updateProfile(
            @RequestBody @Valid UpdateProfileRequest request,
            @AuthenticationPrincipal String email) { ... }

    @PostMapping("/me/avatar")
    public Map<String, String> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal String email) { ... }

    @GetMapping("/{nickname}/online")
    public Map<String, Boolean> isOnline(@PathVariable String nickname) {
        return userRepository.findByNickname(nickname)
            .map(u -> Map.of("online", presenceService.isOnline(u.getUserId())))
            .orElse(Map.of("online", false));
    }

    @PostMapping("/{nickname}/block")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void blockUser(@PathVariable String nickname, @AuthenticationPrincipal String email) {
        User blocker = currentUserResolver.resolve(email);
        User blocked = userRepository.findByNickname(nickname)
            .orElseThrow(() -> new NotFoundException("User not found"));
        if (blocker.getUserId().equals(blocked.getUserId())) return;
        UserBlock.UserBlockId id = new UserBlock.UserBlockId(blocker.getUserId(), blocked.getUserId());
        if (!userBlockRepository.existsById(id)) {
            userBlockRepository.save(UserBlock.builder().id(id).blocker(blocker).blocked(blocked).build());
        }
    }
    // ... deleteAvatar, unblockUser аналогично
}
```

### Построчный разбор

**`@AuthenticationPrincipal String email`**
Spring Security внедряет текущего аутентифицированного пользователя. `JwtAuthenticationFilter` устанавливает email как principal в `UsernamePasswordAuthenticationToken`. Для неавторизованных запросов `email` будет `null`.

**`@GetMapping("/{nickname}")`**
URL с переменной частью. `{nickname}` — плейсхолдер, значение передаётся через `@PathVariable String nickname`.

**`email != null ? ... : null`**
`/api/users/{nickname}` открыт для всех (без авторизации). Если пользователь авторизован — передаём его в `ProfileService` (чтобы определить статус подписки). Если нет — `null`.

**`@RequestParam("file") MultipartFile file`**
Читает файл из multipart/form-data запроса. `"file"` — имя поля формы. Фронтенд отправляет: `Content-Type: multipart/form-data` с полем `file`.

**`userRepository.findByNickname(nickname).map(u -> Map.of("online", ...))`**
`Optional.map()` применяет функцию к значению внутри Optional, если оно есть, и возвращает новый Optional с результатом. `.orElse(Map.of("online", false))` — если пользователь не найден, считаем офлайн.

**`blocker.getUserId().equals(blocked.getUserId())`**
Нельзя заблокировать себя — проверяем, что это разные пользователи. `equals` (а не `==`) — сравниваем значения `Long` объектов, а не ссылки.

**`@PatchMapping("/me")`**
PATCH — частичное обновление ресурса (можно обновить только некоторые поля). В отличие от PUT — полная замена.
