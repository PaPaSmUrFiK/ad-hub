package com.bsuir.adhubbackand.model.dto.response;

import com.bsuir.adhubbackand.model.enums.AdStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record AdResponse(
        Long id,
        String title,
        String description,
        BigDecimal price,
        String currency,
        String location,
        AdStatus status,
        Long userId,
        String userUsername,
        Long categoryId,
        String categoryName,
        Integer viewCount,
        List<MediaItem> mediaFiles,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public record MediaItem(
            Long id,
            String fileUrl,
            String fileType,
            Boolean isPrimary,
            Integer displayOrder
    ) {}
}

