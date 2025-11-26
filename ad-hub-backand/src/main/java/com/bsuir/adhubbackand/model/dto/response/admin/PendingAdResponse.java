package com.bsuir.adhubbackand.model.dto.response.admin;

import com.bsuir.adhubbackand.model.enums.AdStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PendingAdResponse(
        Long id,
        String title,
        String description,
        BigDecimal price,
        String currency,
        String location,
        AdStatus status,
        Long userId,
        String userUsername,
        String userEmail,
        Long categoryId,
        String categoryName,
        Integer viewCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}

