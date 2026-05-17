package com.whitenights.support.api.dto;

import com.whitenights.support.domain.SupportStatus;

import java.time.LocalDateTime;

public record SupportMessageResponse(
    Long supportMessageId,
    Long userId,
    String userNickname,
    String subject,
    String message,
    String response,
    LocalDateTime respondedAt,
    String respondedByNickname,
    SupportStatus status,
    LocalDateTime createdAt
) {

}
