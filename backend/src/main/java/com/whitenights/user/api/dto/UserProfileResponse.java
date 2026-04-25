package com.whitenights.user.api.dto;

import com.whitenights.auth.domain.UserRole;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record UserProfileResponse(
    Long userId,
    String nickname,
    String email, // Only for self
    String bio,
    String avatarUrl,
    UserRole role,
    boolean isPrivate,
    boolean isFollowing, // To be implemented with Feature 03
    long postCount,
    LocalDateTime createdAt
) {}
