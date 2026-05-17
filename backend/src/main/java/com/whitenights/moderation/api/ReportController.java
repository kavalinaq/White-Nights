package com.whitenights.moderation.api;

import com.whitenights.common.security.CurrentUserResolver;
import com.whitenights.moderation.api.dto.CreateReportRequest;
import com.whitenights.moderation.api.dto.ReportResponse;
import com.whitenights.moderation.service.ReportService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
  private final CurrentUserResolver currentUserResolver;

    @PostMapping("/api/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public ReportResponse create(
            @RequestBody @Valid CreateReportRequest request,
            @AuthenticationPrincipal String email) {
      return reportService.create(request, currentUserResolver.resolve(email));
    }

    @GetMapping("/api/reports/me")
    public List<ReportResponse> getMyReports(@AuthenticationPrincipal String email) {
      return reportService.getMyReports(currentUserResolver.resolve(email));
    }

}
