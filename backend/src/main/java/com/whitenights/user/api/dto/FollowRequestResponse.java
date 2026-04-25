package com.whitenights.user.api.dto;

import java.time.LocalDateTime;

public record FollowRequestResponse(
    Long followerId,
    String nickname,
    String avatarUrl,
    LocalDateTime createdAt
) {}
