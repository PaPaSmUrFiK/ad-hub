package com.bsuir.adhubbackand.model.dto.response;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String title,
        String message,
        String notificationTypeName,
        Boolean isRead,
        LocalDateTime sentAt,
        LocalDateTime readAt,
        Long relatedAdId,
        String relatedAdTitle
) {}

