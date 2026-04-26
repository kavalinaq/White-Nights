package com.whitenights.moderation.service;

import com.whitenights.auth.domain.User;
import com.whitenights.common.exception.types.ConflictException;
import com.whitenights.moderation.api.dto.CreateReportRequest;
import com.whitenights.moderation.api.dto.ReportResponse;
import com.whitenights.moderation.domain.Report;
import com.whitenights.moderation.domain.ReportStatus;
import com.whitenights.moderation.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;

    @Transactional
    public ReportResponse create(CreateReportRequest request, User reporter) {
        boolean duplicate = reportRepository.existsByReporter_UserIdAndTargetTypeAndTargetIdAndStatus(
                reporter.getUserId(), request.targetType(), request.targetId(), ReportStatus.pending);
        if (duplicate) {
            throw new ConflictException("You already have a pending report for this target");
        }

        Report report = reportRepository.save(Report.builder()
                .reporter(reporter)
                .targetType(request.targetType())
                .targetId(request.targetId())
                .reason(request.reason())
                .build());

        return toResponse(report);
    }

    public List<ReportResponse> getMyReports(User reporter) {
        return reportRepository.findByReporter_UserIdOrderByCreatedAtDesc(reporter.getUserId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private ReportResponse toResponse(Report r) {
        return new ReportResponse(r.getReportId(), r.getTargetType(), r.getTargetId(),
                r.getReason(), r.getStatus(), r.getCreatedAt());
    }
}
