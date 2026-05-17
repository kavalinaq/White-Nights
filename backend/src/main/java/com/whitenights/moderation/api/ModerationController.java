package com.whitenights.moderation.api;

import com.whitenights.common.security.CurrentUserResolver;
import com.whitenights.moderation.api.dto.ReportResponse;
import com.whitenights.moderation.api.dto.ResolveReportRequest;
import com.whitenights.moderation.service.ModerationService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/moderation")
@RequiredArgsConstructor
public class ModerationController {

    private final ModerationService moderationService;
  private final CurrentUserResolver currentUserResolver;

    @GetMapping("/reports")
    public List<ReportResponse> getQueue(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal String email) {
      return moderationService.getQueue(status, cursor, limit, currentUserResolver.resolve(email));
    }

    @GetMapping("/reports/{id}")
    public ReportResponse getReport(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
      return moderationService.getReport(id, currentUserResolver.resolve(email));
    }

    @PostMapping("/reports/{id}/claim")
    public ReportResponse claim(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
      return moderationService.claim(id, currentUserResolver.resolve(email));
    }

    @PostMapping("/reports/{id}/resolve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resolve(
            @PathVariable Long id,
            @RequestBody @Valid ResolveReportRequest request,
            @AuthenticationPrincipal String email) {
      moderationService.resolve(id, request, currentUserResolver.resolve(email));
    }

}
