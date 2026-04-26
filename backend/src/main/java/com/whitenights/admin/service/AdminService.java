package com.whitenights.admin.service;

import com.whitenights.admin.api.dto.StatsResponse;
import com.whitenights.auth.domain.User;
import com.whitenights.auth.domain.UserRole;
import com.whitenights.auth.repository.RefreshTokenRepository;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.common.exception.types.ForbiddenException;
import com.whitenights.moderation.domain.ModerationAction;
import com.whitenights.moderation.domain.ModerationActionType;
import com.whitenights.moderation.domain.ReportStatus;
import com.whitenights.moderation.repository.ModerationActionRepository;
import com.whitenights.moderation.repository.ReportRepository;
import com.whitenights.post.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ReportRepository reportRepository;
    private final ModerationActionRepository actionRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional
    public void changeRole(Long userId, UserRole newRole, User admin) {
        requireAdmin(admin);
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        actionRepository.save(ModerationAction.builder()
                .moderator(admin)
                .actionType(ModerationActionType.warn_user)
                .comment("Role changed from " + target.getRole() + " to " + newRole)
                .build());

        target.setRole(newRole);
        userRepository.save(target);
    }

    @Transactional
    public void unban(Long userId, User admin) {
        requireAdmin(admin);
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        target.setBlocked(false);
        userRepository.save(target);
    }

    @Transactional
    public void deleteUser(Long userId, User admin) {
        requireAdmin(admin);
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        refreshTokenRepository.deleteByUser(target);
        userRepository.delete(target);
    }

    public StatsResponse getStats(User admin) {
        requireAdmin(admin);
        return new StatsResponse(
                userRepository.count(),
                postRepository.count(),
                reportRepository.countByStatus(ReportStatus.pending),
                0L // chat count: available after Chat feature (#11) is implemented
        );
    }

    private void requireAdmin(User user) {
        if (user.getRole() != UserRole.admin) {
            throw new ForbiddenException("Access denied");
        }
    }
}
