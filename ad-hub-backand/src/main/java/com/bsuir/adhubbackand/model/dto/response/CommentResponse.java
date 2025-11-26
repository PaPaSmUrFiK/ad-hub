package com.bsuir.adhubbackand.model.dto.response;

import java.time.LocalDateTime;

public record CommentResponse(
        Long id,
        Long adId,
        Long userId,
        String userUsername,
        String commentText,
        Boolean isActive,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}

