package com.whitenights.admin.api.dto;

public record StatsResponse(
    long users,
    long posts,
    long pendingReports,
    long chats,
    long moderators,
    long onlineUsers
) {

}
