package com.whitenights.post.api.dto;

import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdatePostRequest(
        @Size(max = 120) String title,
        @Size(max = 120) String author,
        String description,
        List<String> tagNames,
        List<Long> tagIds
) {}
