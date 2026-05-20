# AdminController, AdminService

## Назначение

Административный модуль. Только для роли `admin`. Позволяет менять роли пользователей, разбанивать, удалять аккаунты и получать статистику системы.

## Полный разбор кода

```java
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @PostMapping("/users/{id}/role")
    public void changeRole(@PathVariable Long id, @RequestBody @Valid ChangeRoleRequest request, ...) {
        adminService.changeRole(id, request.role(), admin);
    }

    @PostMapping("/users/{id}/unban")
    public void unban(@PathVariable Long id, ...) { adminService.unban(id, admin); }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Long id, ...) { adminService.deleteUser(id, admin); }

    @GetMapping("/stats")
    public StatsResponse getStats(...) { return adminService.getStats(admin); }
}
```

```java
@Service
public class AdminService {

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void changeRole(Long userId, UserRole newRole, User admin) {
        if (target.getRole() == UserRole.admin && newRole != UserRole.admin) {
            long adminCount = userRepository.countByRole(UserRole.admin);
            if (adminCount <= 1) {
                throw new ForbiddenException("Cannot demote the last admin");
            }
        }
        target.setRole(newRole);
        userRepository.save(target);
        // аудит-запись в moderation_actions
    }

    @PreAuthorize("hasRole('ADMIN')")
    public StatsResponse getStats(User admin) {
        return new StatsResponse(
                userRepository.count(),
                postRepository.count(),
                reportRepository.countByStatus(ReportStatus.pending),
                chatRepository.count(),
                userRepository.countByRole(UserRole.moderator),
                presenceService.getOnlineUsers().size()
        );
    }
}
```

### Построчный разбор

**`@PreAuthorize("hasRole('ADMIN')")`**
Работает через Spring AOP. `hasRole('ADMIN')` проверяет наличие `ROLE_ADMIN` в `GrantedAuthority`. JWT-фильтр добавляет `ROLE_` префикс автоматически.

**Защита от удаления последнего админа**
`countByRole(UserRole.admin) <= 1` — нельзя понизить единственного администратора. Иначе система осталась бы без администратора.

**Аудит изменения роли**
Каждое изменение роли записывается в `moderation_actions` с комментарием `"Role changed from X to Y"` — история действий администратора.

**`StatsResponse`**
Статистика в реальном времени: число пользователей, постов, ожидающих жалоб, чатов, модераторов, онлайн-пользователей. `presenceService.getOnlineUsers().size()` — из in-memory Set.

**`deleteUser`**
Перед удалением пользователя удаляются все его refresh tokens (принудительный выход), потом сам аккаунт. Cascading на уровне БД удалит связанные данные.
