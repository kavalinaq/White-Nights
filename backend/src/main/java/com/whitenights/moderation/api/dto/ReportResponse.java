package com.whitenights.moderation.api.dto;

import com.whitenights.moderation.domain.ReportStatus;
import com.whitenights.moderation.domain.ReportTargetType;

import java.time.LocalDateTime;

public record ReportResponse(
        Long reportId,
        ReportTargetType targetType,
        Long targetId,
        String reason,
        ReportStatus status,
        LocalDateTime createdAt
) {}
