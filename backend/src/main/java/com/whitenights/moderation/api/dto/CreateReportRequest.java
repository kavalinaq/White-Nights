package com.whitenights.moderation.api.dto;

import com.whitenights.moderation.domain.ReportTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReportRequest(
        @NotNull ReportTargetType targetType,
        @NotNull Long targetId,
        @NotBlank @Size(min = 10, max = 1000) String reason
) {}
