package com.whitenights.user.api;

import com.whitenights.auth.domain.User;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.chat.service.PresenceService;
import com.whitenights.common.exception.types.NotFoundException;
import com.whitenights.common.security.CurrentUserResolver;
import com.whitenights.user.api.dto.UpdateProfileRequest;
import com.whitenights.user.api.dto.UserProfileResponse;
import com.whitenights.user.domain.UserBlock;
import com.whitenights.user.repository.UserBlockRepository;
import com.whitenights.user.service.ProfileService;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final UserRepository userRepository;
    private final PresenceService presenceService;
    private final UserBlockRepository userBlockRepository;
  private final CurrentUserResolver currentUserResolver;

    @GetMapping("/me")
    public UserProfileResponse getMyProfile(@AuthenticationPrincipal String email) {
      User user = currentUserResolver.resolve(email);
        return profileService.getProfile(user.getNickname(), user);
    }

    @GetMapping("/{nickname}")
    public UserProfileResponse getProfile(@PathVariable String nickname, @AuthenticationPrincipal String email) {
        User currentUser = null;
        if (email != null) {
            currentUser = userRepository.findByEmail(email).orElse(null);
        }
        return profileService.getProfile(nickname, currentUser);
    }

    @PatchMapping("/me")
    public UserProfileResponse updateProfile(
            @RequestBody @Valid UpdateProfileRequest request,
            @AuthenticationPrincipal String email) {
      User user = currentUserResolver.resolve(email);
        return profileService.updateProfile(request, user);
    }

    @PostMapping("/me/avatar")
    public Map<String, String> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal String email) {
      User user = currentUserResolver.resolve(email);
        String url = profileService.uploadAvatar(file, user);
        return Map.of("avatarUrl", url);
    }

    @GetMapping("/{nickname}/online")
    public Map<String, Boolean> isOnline(@PathVariable String nickname) {
        return userRepository.findByNickname(nickname)
                .map(u -> Map.of("online", presenceService.isOnline(u.getUserId())))
                .orElse(Map.of("online", false));
    }

    @DeleteMapping("/me/avatar")
    public void deleteAvatar(@AuthenticationPrincipal String email) {
      User user = currentUserResolver.resolve(email);
        profileService.deleteAvatar(user);
    }

    @PostMapping("/{nickname}/block")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void blockUser(@PathVariable String nickname, @AuthenticationPrincipal String email) {
      User blocker = currentUserResolver.resolve(email);
        User blocked = userRepository.findByNickname(nickname)
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (blocker.getUserId().equals(blocked.getUserId())) return;
        UserBlock.UserBlockId id = new UserBlock.UserBlockId(blocker.getUserId(), blocked.getUserId());
        if (!userBlockRepository.existsById(id)) {
            userBlockRepository.save(UserBlock.builder()
                    .id(id)
                    .blocker(blocker)
                    .blocked(blocked)
                    .build());
        }
    }

    @DeleteMapping("/{nickname}/block")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unblockUser(@PathVariable String nickname, @AuthenticationPrincipal String email) {
      User blocker = currentUserResolver.resolve(email);
        User blocked = userRepository.findByNickname(nickname)
                .orElseThrow(() -> new NotFoundException("User not found"));
        userBlockRepository.deleteById(new UserBlock.UserBlockId(blocker.getUserId(), blocked.getUserId()));
    }
}
