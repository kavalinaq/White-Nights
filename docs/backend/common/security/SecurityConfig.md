# SecurityConfig

## Назначение

Главная конфигурация Spring Security. Определяет: какие URL доступны без авторизации, как проверяются токены, какой алгоритм хэширования паролей используется. Это «привратник» всего приложения — все HTTP-запросы проходят через настроенную здесь цепочку фильтров.

## Полный разбор кода

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/ws/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter,
                UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### Построчный разбор

**`@Configuration`**
Класс является источником Spring-бинов (методы с `@Bean`). Spring обрабатывает его при запуске и регистрирует все бины.

**`@EnableWebSecurity`**
Активирует Spring Security для веб-приложения. Без этого фильтры безопасности не будут работать.

**`@EnableMethodSecurity`**
Включает аннотации безопасности на уровне методов: `@PreAuthorize("hasRole('admin')")`. Позволяет ограничивать доступ не только по URL, но и по отдельным методам.

**`SecurityFilterChain filterChain(HttpSecurity http)`**
Фабричный метод, создающий цепочку фильтров безопасности. `@Bean` — Spring регистрирует возвращаемый объект как управляемый компонент.

**`.csrf(AbstractHttpConfigurer::disable)`**
CSRF (Cross-Site Request Forgery) защита отключена. В REST API со stateless JWT-аутентификацией CSRF не актуален: куки с сессией отсутствуют (refresh-токен в httpOnly cookie ограничен путём `/api/auth`). `AbstractHttpConfigurer::disable` — ссылка на метод, эквивалент `csrf -> csrf.disable()`.

**`.authorizeHttpRequests(auth -> auth ...)`**
Лямбда настройки авторизации. Правила проверяются сверху вниз, применяется первое совпавшее.

**`.requestMatchers("/api/auth/**").permitAll()`**
`**` — wildcard для любого пути. Эндпоинты регистрации, входа, подтверждения — открыты для всех.

**`.requestMatchers("/ws/**").permitAll()`**
WebSocket handshake происходит без JWT — аутентификация выполняется позже через `WebSocketAuthInterceptor`.

**`.requestMatchers(HttpMethod.GET, "/api/users/**").permitAll()`**
GET-запросы к профилям пользователей доступны без авторизации (публичные профили). POST/PUT/DELETE к `/api/users/**` — только авторизованным.

**`.anyRequest().authenticated()`**
Все остальные запросы требуют аутентификации. Это «закрытый по умолчанию» принцип безопасности.

**`.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)`**
Вставляет JWT-фильтр в цепочку *перед* стандартным фильтром логина по форме. Наш фильтр извлекает пользователя из токена до того, как Spring Security проверит стандартную форму аутентификации.

**`new BCryptPasswordEncoder()`**
BCrypt — адаптивный алгоритм хэширования паролей. Автоматически добавляет соль (случайные данные) к каждому паролю — два одинаковых пароля дают разные хэши. Можно замедлить алгоритм, увеличив «cost factor» — защита от перебора на мощных компьютерах.
