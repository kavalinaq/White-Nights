package com.whitenights.moderation.service;

import com.whitenights.auth.domain.User;
import com.whitenights.auth.repository.RefreshTokenRepository;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.common.exception.types.ConflictException;
import com.whitenights.common.exception.types.NotFoundException;
import com.whitenights.moderation.api.dto.ReportResponse;
import com.whitenights.moderation.api.dto.ResolveReportRequest;
import com.whitenights.moderation.domain.ModerationAction;
import com.whitenights.moderation.domain.ModerationActionType;
import com.whitenights.moderation.domain.Report;
import com.whitenights.moderation.domain.ReportStatus;
import com.whitenights.moderation.domain.ReportTargetType;
import com.whitenights.moderation.repository.ModerationActionRepository;
import com.whitenights.moderation.repository.ReportRepository;
import com.whitenights.post.domain.Comment;
import com.whitenights.post.domain.Post;
import com.whitenights.post.repository.CommentRepository;
import com.whitenights.post.repository.PostRepository;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ModerationService {

    private final ReportRepository reportRepository;
    private final ModerationActionRepository actionRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
  private final CommentRepository commentRepository;

  @PreAuthorize("hasAnyRole('MODERATOR','ADMIN')")
  @Transactional(readOnly = true)
    public List<ReportResponse> getQueue(String status, Long cursor, int limit, User moderator) {
        List<ReportStatus> statuses = status != null
                ? List.of(ReportStatus.valueOf(status))
                : List.of(ReportStatus.pending, ReportStatus.in_review);
    List<Report> reports = reportRepository.findQueueWithCursor(
        statuses, cursor, PageRequest.of(0, Math.min(limit, 50)));
    return toResponses(reports);
    }

  @PreAuthorize("hasAnyRole('MODERATOR','ADMIN')")
  @Transactional(readOnly = true)
    public ReportResponse getReport(Long reportId, User moderator) {
        Report report = requireReport(reportId);
    return toResponses(List.of(report)).get(0);
    }

  @PreAuthorize("hasAnyRole('MODERATOR','ADMIN')")
    @Transactional
    public ReportResponse claim(Long reportId, User moderator) {
        Report report = requireReport(reportId);
        if (report.getStatus() == ReportStatus.resolved) {
          throw new ConflictException("Report is already resolved");
        }
        report.setStatus(ReportStatus.in_review);
    return toResponses(List.of(reportRepository.save(report))).get(0);
    }

  @PreAuthorize("hasAnyRole('MODERATOR','ADMIN')")
    @Transactional
    public void resolve(Long reportId, ResolveReportRequest request, User moderator) {
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
                .orElseThrow(() -> new NotFoundException("Report not found"));
    }

  private List<ReportResponse> toResponses(List<Report> reports) {
    if (reports.isEmpty()) {
      return List.of();
    }

    Set<Long> userTargetIds = collectTargetIds(reports, ReportTargetType.user);
    Set<Long> postTargetIds = collectTargetIds(reports, ReportTargetType.post);
    Set<Long> commentTargetIds = collectTargetIds(reports, ReportTargetType.comment);

    Map<Long, String> userNicknames = byId(
        userRepository.findAllById(userTargetIds), User::getUserId, User::getNickname);
    Map<Long, String> postTitles = byId(
        postRepository.findAllById(postTargetIds), Post::getPostId, Post::getTitle);
    Map<Long, Comment> commentsById = commentRepository.findAllById(commentTargetIds).stream()
        .collect(Collectors.toMap(Comment::getCommentId, Function.identity()));

    return reports.stream()
        .map(r -> buildResponse(r, userNicknames, postTitles, commentsById))
        .toList();
  }

  private ReportResponse buildResponse(
      Report r,
      Map<Long, String> userNicknames,
      Map<Long, String> postTitles,
      Map<Long, Comment> commentsById) {
    Long reporterUserId = r.getReporter() != null ? r.getReporter().getUserId() : null;
    String reporterNickname = r.getReporter() != null ? r.getReporter().getNickname() : null;

    String targetUserNickname = null;
    String targetPostTitle = null;
    Long targetCommentPostId = null;
    String targetCommentText = null;

    switch (r.getTargetType()) {
      case user -> targetUserNickname = userNicknames.get(r.getTargetId());
      case post -> targetPostTitle = postTitles.get(r.getTargetId());
      case comment -> {
        Comment c = commentsById.get(r.getTargetId());
        if (c != null) {
          targetCommentPostId = c.getPost() != null ? c.getPost().getPostId() : null;
          targetCommentText = c.getText();
        }
      }
    }

    return new ReportResponse(
        r.getReportId(),
        r.getTargetType(),
        r.getTargetId(),
        r.getReason(),
        r.getStatus(),
        r.getCreatedAt(),
        reporterUserId,
        reporterNickname,
        targetUserNickname,
        targetPostTitle,
        targetCommentPostId,
        targetCommentText
    );
  }

  private Set<Long> collectTargetIds(List<Report> reports, ReportTargetType type) {
    Set<Long> ids = new HashSet<>();
    for (Report r : reports) {
      if (r.getTargetType() == type) {
        ids.add(r.getTargetId());
      }
    }
    return ids;
  }

  private <T> Map<Long, String> byId(Collection<T> items, Function<T, Long> id, Function<T, String> value) {
    return items.stream().collect(Collectors.toMap(id, value));
    }
}
