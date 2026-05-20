# JwtAuthenticationFilter

## Назначение

HTTP-фильтр, который обрабатывает каждый входящий запрос. Извлекает JWT из заголовка `Authorization`, проверяет его валидность и, если токен корректный, устанавливает информацию о пользователе в `SecurityContext` — Spring Security использует её для авторизации.

## Полный разбор кода

```java
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        try {
            userEmail = jwtService.extractEmail(jwt);
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                String role = jwtService.extractRole(jwt);
                String authority = "ROLE_" + (role != null ? role.toUpperCase() : "USER");

                UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                        userEmail,
                        null,
                        List.of(new SimpleGrantedAuthority(authority))
                    );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception e) {
            // Token is invalid or expired — не устанавливаем аутентификацию
        }
        filterChain.doFilter(request, response);
    }
}
```

### Построчный разбор

**`extends OncePerRequestFilter`**
Базовый класс Spring, гарантирующий, что `doFilterInternal` вызывается ровно один раз за HTTP-запрос (без дублирования при forward/include).

**`FilterChain filterChain`**
Цепочка фильтров. После обработки нашего фильтра вызов `filterChain.doFilter(request, response)` передаёт запрос следующему фильтру в цепочке (или в сервлет, если фильтров больше нет).

**`request.getHeader("Authorization")`**
Читает HTTP-заголовок. Фронтенд отправляет: `Authorization: Bearer eyJhbGciOi...`

**`if (authHeader == null || !authHeader.startsWith("Bearer "))`**
Если заголовка нет или формат неверный — пропускаем запрос без аутентификации. `filterChain.doFilter(...)` продолжает цепочку, после чего Spring Security проверит, нужна ли аутентификация для данного URL. `return` — выходим из метода досрочно.

**`authHeader.substring(7)`**
Обрезаем префикс `"Bearer "` (7 символов, включая пробел) — получаем чистый токен.

**`SecurityContextHolder.getContext().getAuthentication() == null`**
Проверяем, что аутентификация ещё не установлена (нет смысла обрабатывать токен дважды).

**`"ROLE_" + role.toUpperCase()`**
Spring Security требует, чтобы роли начинались с префикса `ROLE_`. Роль `"admin"` из JWT превращается в `"ROLE_ADMIN"`. При проверке `hasRole("admin")` Spring автоматически добавляет `ROLE_`, поэтому в конфигурации пишем просто `"admin"`.

**`new UsernamePasswordAuthenticationToken(userEmail, null, List.of(new SimpleGrantedAuthority(authority)))`**
Создаёт объект аутентификации для Spring Security:
- 1-й аргумент: principal (email пользователя)
- 2-й аргумент: credentials (пароль — `null`, так как он уже проверен при выдаче токена)
- 3-й аргумент: список полномочий (ролей)

**`authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request))`**
Добавляет детали запроса (IP-адрес, session ID) в объект аутентификации. Нужно для аудита и некоторых расширений Spring Security.

**`SecurityContextHolder.getContext().setAuthentication(authToken)`**
Сохраняет аутентификацию в thread-local хранилище Spring Security. Теперь любой компонент может получить текущего пользователя через `SecurityContextHolder.getContext().getAuthentication()`.

**`catch (Exception e) { // пусто }`**
Если токен невалидный или истёк — просто не устанавливаем аутентификацию. Spring Security сам вернёт 401, если endpoint требует авторизации.
