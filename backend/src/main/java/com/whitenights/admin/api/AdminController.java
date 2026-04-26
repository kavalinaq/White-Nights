package com.whitenights.admin.api;

import com.whitenights.admin.api.dto.ChangeRoleRequest;
import com.whitenights.admin.api.dto.StatsResponse;
import com.whitenights.admin.service.AdminService;
import com.whitenights.auth.domain.User;
import com.whitenights.auth.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final UserRepository userRepository;

    @PostMapping("/users/{id}/role")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeRole(
            @PathVariable Long id,
            @RequestBody @Valid ChangeRoleRequest request,
            @AuthenticationPrincipal String email) {
        adminService.changeRole(id, request.role(), resolveUser(email));
    }

    @PostMapping("/users/{id}/unban")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unban(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        adminService.unban(id, resolveUser(email));
    }

    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        adminService.deleteUser(id, resolveUser(email));
    }

    @GetMapping("/stats")
    public StatsResponse getStats(@AuthenticationPrincipal String email) {
        return adminService.getStats(resolveUser(email));
    }

    private User resolveUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
