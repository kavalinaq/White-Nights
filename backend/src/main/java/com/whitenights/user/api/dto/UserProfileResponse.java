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
    String followStatus, // none, pending, accepted
    long followingCount,
    long followerCount,
    long postCount,
    LocalDateTime createdAt
) {}
