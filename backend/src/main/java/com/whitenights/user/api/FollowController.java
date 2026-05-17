package com.whitenights.user.api;

import com.whitenights.auth.domain.User;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.common.exception.types.NotFoundException;
import com.whitenights.common.security.CurrentUserResolver;
import com.whitenights.user.api.dto.FollowRequestResponse;
import com.whitenights.user.api.dto.UserSummaryResponse;
import com.whitenights.user.domain.FollowStatus;
import com.whitenights.user.repository.FollowRepository;
import com.whitenights.user.service.FollowService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;
    private final FollowRepository followRepository;
    private final UserRepository userRepository;
  private final CurrentUserResolver currentUserResolver;

    @GetMapping("/{id}/followers")
    public List<UserSummaryResponse> getFollowers(
            @PathVariable Long id,
            @RequestParam(defaultValue = "50") int limit) {
        User target = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        return followRepository.findByFolloweeAndStatus(target, FollowStatus.accepted, PageRequest.of(0, Math.min(limit, 100)))
                .stream()
                .map(f -> new UserSummaryResponse(
                        f.getFollower().getUserId(),
                        f.getFollower().getNickname(),
                        f.getFollower().getAvatarUrl()
                ))
                .toList();
    }

    @GetMapping("/{id}/following")
    public List<UserSummaryResponse> getFollowing(
            @PathVariable Long id,
            @RequestParam(defaultValue = "50") int limit) {
        User target = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
        return followRepository.findByFollowerAndStatus(target, FollowStatus.accepted, PageRequest.of(0, Math.min(limit, 100)))
                .stream()
                .map(f -> new UserSummaryResponse(
                        f.getFollowee().getUserId(),
                        f.getFollowee().getNickname(),
                        f.getFollowee().getAvatarUrl()
                ))
                .toList();
    }

    @PostMapping("/{id}/follow")
    public void follow(@PathVariable Long id, @AuthenticationPrincipal String email) {
      User currentUser = currentUserResolver.resolve(email);
        followService.follow(id, currentUser);
    }

    @DeleteMapping("/{id}/follow")
    public void unfollow(@PathVariable Long id, @AuthenticationPrincipal String email) {
      User currentUser = currentUserResolver.resolve(email);
        followService.unfollow(id, currentUser);
    }

    @GetMapping("/me/follow-requests")
    public List<FollowRequestResponse> getFollowRequests(@AuthenticationPrincipal String email) {
      User currentUser = currentUserResolver.resolve(email);

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
      User currentUser = currentUserResolver.resolve(email);
        followService.acceptRequest(followerId, currentUser);
    }

    @PostMapping("/me/follow-requests/{followerId}/reject")
    public void rejectRequest(@PathVariable Long followerId, @AuthenticationPrincipal String email) {
      User currentUser = currentUserResolver.resolve(email);
        followService.rejectRequest(followerId, currentUser);
    }
}
