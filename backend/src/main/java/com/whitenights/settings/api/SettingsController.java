package com.whitenights.settings.api;

import com.whitenights.common.security.CurrentUserResolver;
import com.whitenights.post.api.dto.PostSummaryResponse;
import com.whitenights.settings.api.dto.ChangePasswordRequest;
import com.whitenights.settings.api.dto.SupportRequest;
import com.whitenights.settings.service.SettingsService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;
  private final CurrentUserResolver currentUserResolver;

    @GetMapping("/api/users/me/saved")
    public List<PostSummaryResponse> getSavedPosts(
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal String email) {
      return settingsService.getSavedPosts(currentUserResolver.resolve(email), cursor, limit);
    }

    @PostMapping("/api/users/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(
            @RequestBody @Valid ChangePasswordRequest request,
            @AuthenticationPrincipal String email) {
      settingsService.changePassword(currentUserResolver.resolve(email), request.currentPassword(), request.newPassword());
    }

    @PostMapping("/api/support")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void sendSupport(
            @RequestBody @Valid SupportRequest request,
            @AuthenticationPrincipal String email) {
      settingsService.sendSupportMessage(currentUserResolver.resolve(email), request.subject(), request.message());
    }

    @DeleteMapping("/api/users/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAccount(@AuthenticationPrincipal String email) {
      settingsService.deleteAccount(currentUserResolver.resolve(email));
    }

}
