package com.whitenights.admin.service;

import com.whitenights.admin.api.dto.StatsResponse;
import com.whitenights.auth.domain.User;
import com.whitenights.auth.domain.UserRole;
import com.whitenights.auth.repository.RefreshTokenRepository;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.chat.repository.ChatRepository;
import com.whitenights.chat.service.PresenceService;
import com.whitenights.common.exception.types.ForbiddenException;
import com.whitenights.common.exception.types.NotFoundException;
import com.whitenights.moderation.domain.ModerationAction;
import com.whitenights.moderation.domain.ModerationActionType;
import com.whitenights.moderation.domain.ReportStatus;
import com.whitenights.moderation.repository.ModerationActionRepository;
import com.whitenights.moderation.repository.ReportRepository;
import com.whitenights.post.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
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
    private final ChatRepository chatRepository;
    private final PresenceService presenceService;

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void changeRole(Long userId, UserRole newRole, User admin) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (target.getRole() == UserRole.admin && newRole != UserRole.admin) {
            long adminCount = userRepository.countByRole(UserRole.admin);
            if (adminCount <= 1) {
                throw new ForbiddenException("Cannot demote the last admin");
            }
        }

        actionRepository.save(ModerationAction.builder()
                .moderator(admin)
                .actionType(ModerationActionType.warn_user)
                .comment("Role changed from " + target.getRole() + " to " + newRole)
                .build());

        target.setRole(newRole);
        userRepository.save(target);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void unban(Long userId, User admin) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        target.setBlocked(false);
        userRepository.save(target);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void deleteUser(Long userId, User admin) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        refreshTokenRepository.deleteByUser(target);
        userRepository.delete(target);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public StatsResponse getStats(User admin) {
        return new StatsResponse(
                userRepository.count(),
                postRepository.count(),
                reportRepository.countByStatus(ReportStatus.pending),
            chatRepository.count(),
            userRepository.countByRole(UserRole.moderator),
            presenceService.getOnlineUsers().size()
        );
    }

}
