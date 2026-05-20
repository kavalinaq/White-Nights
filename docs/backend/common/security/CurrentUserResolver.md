# CurrentUserResolver

## Назначение

Вспомогательный компонент для получения текущего аутентифицированного пользователя из базы данных. Принимает email (извлечённый из JWT через Spring Security) и возвращает полный объект `User`. Избавляет контроллеры от повторяющегося кода поиска пользователя.

## Полный разбор кода

```java
@Component
@RequiredArgsConstructor
public class CurrentUserResolver {

    private final UserRepository userRepository;

    public User resolve(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new NotFoundException("User not found"));
    }
}
```

### Построчный разбор

**`@Component`**
Обобщённая аннотация Spring — помечает класс как компонент, который Spring создаёт и управляет им. В отличие от `@Service` нет специальной семантики — просто управляемый бин.

**`public User resolve(String email)`**
Принимает email из `SecurityContextHolder` (устанавливается `JwtAuthenticationFilter`) и загружает полную сущность `User` из БД.

**Типичное использование в контроллере:**
```java
@GetMapping("/me")
public UserProfileResponse getMyProfile(Principal principal) {
    User user = currentUserResolver.resolve(principal.getName());
    return profileService.getProfile(user);
}
```
`Principal.getName()` возвращает email, который `JwtAuthenticationFilter` установил как principal в `UsernamePasswordAuthenticationToken`.
