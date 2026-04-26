package com.whitenights.moderation.api.dto;

import com.whitenights.moderation.domain.ModerationActionType;
import jakarta.validation.constraints.NotNull;

public record ResolveReportRequest(
        @NotNull ModerationActionType action,
        String comment
) {}
