package com.whitenights.bookshelf.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddBookRequest(
        @NotBlank @Size(max = 255) String title,
        @NotBlank @Size(max = 255) String author
) {}
