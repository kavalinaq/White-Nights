package com.whitenights.user.service;

import com.whitenights.auth.domain.User;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.common.exception.types.ConflictException;
import com.whitenights.common.storage.StorageService;
import com.whitenights.post.repository.PostRepository;
import com.whitenights.user.api.dto.UpdateProfileRequest;
import com.whitenights.user.api.dto.UserProfileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final StorageService storageService;

    @Value("${minio.bucket}")
    private String avatarBucket;

    public UserProfileResponse getProfile(String nickname, User currentUser) {
        User user = userRepository.findByNickname(nickname)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isSelf = currentUser != null && currentUser.getUserId().equals(user.getUserId());
        
        // Handle privacy
        if (user.isPrivate() && !isSelf) {
            // Check if following (to be implemented with Feature 03)
            // For now, if private and not self, hide sensitive info
            return UserProfileResponse.builder()
                    .userId(user.getUserId())
                    .nickname(user.getNickname())
                    .avatarUrl(user.getAvatarUrl())
                    .bio(user.getBio())
                    .isPrivate(true)
                    .postCount(postRepository.countByUser(user))
                    .createdAt(user.getCreatedAt())
                    .build();
        }

        return UserProfileResponse.builder()
                .userId(user.getUserId())
                .nickname(user.getNickname())
                .email(isSelf ? user.getEmail() : null)
                .bio(user.getBio())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .isPrivate(user.isPrivate())
                .postCount(postRepository.countByUser(user))
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Transactional
    public UserProfileResponse updateProfile(UpdateProfileRequest request, User currentUser) {
        if (request.nickname() != null && !request.nickname().equals(currentUser.getNickname())) {
            if (userRepository.existsByNickname(request.nickname())) {
                throw new ConflictException("Nickname already exists");
            }
            currentUser.setNickname(request.nickname());
        }

        if (request.bio() != null) {
            currentUser.setBio(request.bio());
        }

        if (request.isPrivate() != null) {
            currentUser.setPrivate(request.isPrivate());
        }

        userRepository.save(currentUser);

        return getProfile(currentUser.getNickname(), currentUser);
    }

    @Transactional
    public String uploadAvatar(MultipartFile file, User currentUser) {
        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed");
        }

        // Delete old avatar if exists
        if (currentUser.getAvatarUrl() != null) {
            String oldFilename = currentUser.getAvatarUrl().substring(currentUser.getAvatarUrl().lastIndexOf("/") + 1);
            storageService.deleteFile(avatarBucket, oldFilename);
        }

        String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        String url = storageService.uploadFile(avatarBucket, filename, file);

        currentUser.setAvatarUrl(url);
        userRepository.save(currentUser);

        return url;
    }

    @Transactional
    public void deleteAvatar(User currentUser) {
        if (currentUser.getAvatarUrl() != null) {
            String filename = currentUser.getAvatarUrl().substring(currentUser.getAvatarUrl().lastIndexOf("/") + 1);
            storageService.deleteFile(avatarBucket, filename);
            currentUser.setAvatarUrl(null);
            userRepository.save(currentUser);
        }
    }
}
