package com.whitenights.moderation.api;

import com.whitenights.auth.domain.User;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.moderation.api.dto.ReportResponse;
import com.whitenights.moderation.api.dto.ResolveReportRequest;
import com.whitenights.moderation.service.ModerationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/moderation")
@RequiredArgsConstructor
public class ModerationController {

    private final ModerationService moderationService;
    private final UserRepository userRepository;

    @GetMapping("/reports")
    public List<ReportResponse> getQueue(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal String email) {
        return moderationService.getQueue(status, cursor, limit, resolveUser(email));
    }

    @GetMapping("/reports/{id}")
    public ReportResponse getReport(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        return moderationService.getReport(id, resolveUser(email));
    }

    @PostMapping("/reports/{id}/claim")
    public ReportResponse claim(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        return moderationService.claim(id, resolveUser(email));
    }

    @PostMapping("/reports/{id}/resolve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resolve(
            @PathVariable Long id,
            @RequestBody @Valid ResolveReportRequest request,
            @AuthenticationPrincipal String email) {
        moderationService.resolve(id, request, resolveUser(email));
    }

    private User resolveUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
