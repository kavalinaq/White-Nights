package com.whitenights.chat.api.dto;

public record ChatResponse(
        Long chatId,
        String name,
        boolean isGroup,
        int memberCount,
        MessageResponse lastMessage,
        String avatarUrl,
        Long ownerId
) {}
