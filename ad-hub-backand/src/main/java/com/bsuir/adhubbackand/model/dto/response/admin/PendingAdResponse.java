package com.bsuir.adhubbackand.model.dto.response.admin;

import com.bsuir.adhubbackand.model.enums.AdStatus;
import com.bsuir.adhubbackand.model.dto.response.AdMediaResponse;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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
        List<AdMediaResponse> mediaFiles,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}

