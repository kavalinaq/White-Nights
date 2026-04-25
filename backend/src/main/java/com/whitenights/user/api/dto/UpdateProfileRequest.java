package com.whitenights.user.api.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @Size(min = 3, max = 50) String nickname,
    @Size(max = 500) String bio,
    Boolean isPrivate
) {}
