package com.whitenights.moderation.service;

import com.whitenights.auth.domain.User;
import com.whitenights.auth.domain.UserRole;
import com.whitenights.auth.repository.RefreshTokenRepository;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.common.exception.types.ForbiddenException;
import com.whitenights.moderation.api.dto.ReportResponse;
import com.whitenights.moderation.api.dto.ResolveReportRequest;
import com.whitenights.moderation.domain.ModerationAction;
import com.whitenights.moderation.domain.ModerationActionType;
import com.whitenights.moderation.domain.Report;
import com.whitenights.moderation.domain.ReportStatus;
import com.whitenights.moderation.domain.ReportTargetType;
import com.whitenights.moderation.repository.ModerationActionRepository;
import com.whitenights.moderation.repository.ReportRepository;
import com.whitenights.post.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ModerationService {

    private final ReportRepository reportRepository;
    private final ModerationActionRepository actionRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    public List<ReportResponse> getQueue(String status, Long cursor, int limit, User moderator) {
        requireModerator(moderator);
        List<ReportStatus> statuses = status != null
                ? List.of(ReportStatus.valueOf(status))
                : List.of(ReportStatus.pending, ReportStatus.in_review);
        return reportRepository.findQueueWithCursor(statuses, cursor, PageRequest.of(0, Math.min(limit, 50)))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ReportResponse getReport(Long reportId, User moderator) {
        requireModerator(moderator);
        Report report = requireReport(reportId);
        return toResponse(report);
    }

    @Transactional
    public ReportResponse claim(Long reportId, User moderator) {
        requireModerator(moderator);
        Report report = requireReport(reportId);
        if (report.getStatus() == ReportStatus.resolved) {
            throw new RuntimeException("Report is already resolved");
        }
        report.setStatus(ReportStatus.in_review);
        return toResponse(reportRepository.save(report));
    }

    @Transactional
    public void resolve(Long reportId, ResolveReportRequest request, User moderator) {
        requireModerator(moderator);
        Report report = requireReport(reportId);

        applyAction(report, request.action());

        actionRepository.save(ModerationAction.builder()
                .report(report)
                .moderator(moderator)
                .actionType(request.action())
                .comment(request.comment())
                .build());

        report.setStatus(ReportStatus.resolved);
        reportRepository.save(report);
    }

    private void applyAction(Report report, ModerationActionType action) {
        switch (action) {
            case block_post -> {
                if (report.getTargetType() == ReportTargetType.post) {
                    postRepository.findById(report.getTargetId()).ifPresent(post -> {
                        post.setBlocked(true);
                        postRepository.save(post);
                    });
                }
            }
            case ban_user -> {
                Long userId = resolveUserTarget(report);
                if (userId != null) {
                    userRepository.findById(userId).ifPresent(user -> {
                        user.setBlocked(true);
                        userRepository.save(user);
                        refreshTokenRepository.deleteByUser(user);
                    });
                }
            }
            case warn_user, reject -> { /* stub / no-op in v1 */ }
        }
    }

    private Long resolveUserTarget(Report report) {
        return switch (report.getTargetType()) {
            case user -> report.getTargetId();
            case post -> postRepository.findById(report.getTargetId())
                    .map(p -> p.getUser().getUserId()).orElse(null);
            case comment -> null;
        };
    }

    private Report requireReport(Long reportId) {
        return reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
    }

    private void requireModerator(User user) {
        if (user.getRole() != UserRole.moderator && user.getRole() != UserRole.admin) {
            throw new ForbiddenException("Access denied");
        }
    }

    private ReportResponse toResponse(Report r) {
        return new ReportResponse(r.getReportId(), r.getTargetType(), r.getTargetId(),
                r.getReason(), r.getStatus(), r.getCreatedAt());
    }
}
