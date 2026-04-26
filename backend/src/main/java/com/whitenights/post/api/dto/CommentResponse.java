package com.whitenights.post.api.dto;

import java.time.LocalDateTime;

public record CommentResponse(
        Long commentId,
        String text,
        LocalDateTime createdAt,
        AuthorInfo author
) {
    public record AuthorInfo(Long userId, String nickname, String avatarUrl) {}
}
