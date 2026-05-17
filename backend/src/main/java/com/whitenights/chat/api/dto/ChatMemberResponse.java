package com.whitenights.chat.api.dto;

import java.time.LocalDateTime;

public record ChatMemberResponse(
    Long userId,
    String nickname,
    String avatarUrl,
    String role,
    LocalDateTime joinedAt
) {

}
