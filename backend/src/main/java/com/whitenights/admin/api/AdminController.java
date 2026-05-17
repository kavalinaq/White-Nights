package com.whitenights.admin.api;

import com.whitenights.admin.api.dto.ChangeRoleRequest;
import com.whitenights.admin.api.dto.StatsResponse;
import com.whitenights.admin.service.AdminService;
import com.whitenights.common.security.CurrentUserResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final CurrentUserResolver currentUserResolver;

    @PostMapping("/users/{id}/role")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeRole(
            @PathVariable Long id,
            @RequestBody @Valid ChangeRoleRequest request,
            @AuthenticationPrincipal String email) {
        adminService.changeRole(id, request.role(), currentUserResolver.resolve(email));
    }

    @PostMapping("/users/{id}/unban")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unban(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        adminService.unban(id, currentUserResolver.resolve(email));
    }

    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        adminService.deleteUser(id, currentUserResolver.resolve(email));
    }

    @GetMapping("/stats")
    public StatsResponse getStats(@AuthenticationPrincipal String email) {
        return adminService.getStats(currentUserResolver.resolve(email));
    }

}
