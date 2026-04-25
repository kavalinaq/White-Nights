package com.whitenights.user.api;

import com.whitenights.auth.domain.User;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.user.api.dto.UpdateProfileRequest;
import com.whitenights.user.api.dto.UserProfileResponse;
import com.whitenights.user.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public UserProfileResponse getMyProfile(@AuthenticationPrincipal String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
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
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return profileService.updateProfile(request, user);
    }

    @PostMapping("/me/avatar")
    public Map<String, String> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String url = profileService.uploadAvatar(file, user);
        return Map.of("avatarUrl", url);
    }

    @DeleteMapping("/me/avatar")
    public void deleteAvatar(@AuthenticationPrincipal String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        profileService.deleteAvatar(user);
    }
}
