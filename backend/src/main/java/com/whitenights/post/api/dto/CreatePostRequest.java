package com.whitenights.post.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreatePostRequest(
        @NotBlank @Size(max = 120) String title,
        @NotBlank @Size(max = 120) String author,
        @NotBlank String description,
        List<String> tagNames,
        List<Long> tagIds
) {}
