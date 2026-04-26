package com.whitenights.post.api.dto;

import com.whitenights.tag.api.dto.TagResponse;

import java.time.LocalDateTime;
import java.util.List;

public record PostSummaryResponse(
        Long postId,
        String imageUrl,
        String title,
        String author,
        String description,
        LocalDateTime createdAt,
        AuthorInfo authorInfo,
        List<TagResponse> tags,
        long likeCount,
        long commentCount,
        long viewCount,
        boolean liked,
        boolean saved
) {
    public record AuthorInfo(Long userId, String nickname, String avatarUrl) {}
}
