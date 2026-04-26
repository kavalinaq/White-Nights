package com.whitenights.moderation.api;

import com.whitenights.auth.domain.User;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.moderation.api.dto.CreateReportRequest;
import com.whitenights.moderation.api.dto.ReportResponse;
import com.whitenights.moderation.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final UserRepository userRepository;

    @PostMapping("/api/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public ReportResponse create(
            @RequestBody @Valid CreateReportRequest request,
            @AuthenticationPrincipal String email) {
        return reportService.create(request, resolveUser(email));
    }

    @GetMapping("/api/reports/me")
    public List<ReportResponse> getMyReports(@AuthenticationPrincipal String email) {
        return reportService.getMyReports(resolveUser(email));
    }

    private User resolveUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
