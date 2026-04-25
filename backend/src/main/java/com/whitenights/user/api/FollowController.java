package com.whitenights.user.api;

import com.whitenights.auth.domain.User;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.user.api.dto.FollowRequestResponse;
import com.whitenights.user.domain.FollowStatus;
import com.whitenights.user.repository.FollowRepository;
import com.whitenights.user.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;
    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    @PostMapping("/{id}/follow")
    public void follow(@PathVariable Long id, @AuthenticationPrincipal String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        followService.follow(id, currentUser);
    }

    @DeleteMapping("/{id}/follow")
    public void unfollow(@PathVariable Long id, @AuthenticationPrincipal String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        followService.unfollow(id, currentUser);
    }

    @GetMapping("/me/follow-requests")
    public List<FollowRequestResponse> getFollowRequests(@AuthenticationPrincipal String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return followRepository.findByFolloweeAndStatus(currentUser, FollowStatus.pending, PageRequest.of(0, 100))
                .stream()
                .map(f -> new FollowRequestResponse(
                        f.getFollower().getUserId(),
                        f.getFollower().getNickname(),
                        f.getFollower().getAvatarUrl(),
                        f.getCreatedAt()
                ))
                .toList();
    }

    @PostMapping("/me/follow-requests/{followerId}/accept")
    public void acceptRequest(@PathVariable Long followerId, @AuthenticationPrincipal String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        followService.acceptRequest(followerId, currentUser);
    }

    @PostMapping("/me/follow-requests/{followerId}/reject")
    public void rejectRequest(@PathVariable Long followerId, @AuthenticationPrincipal String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        followService.rejectRequest(followerId, currentUser);
    }
}
