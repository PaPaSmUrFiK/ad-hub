package com.bsuir.adhubbackand.model.dto.response;

import java.time.LocalDateTime;

public record FavoriteResponse(
        Long id,
        Long adId,
        String adTitle,
        String adDescription,
        AdResponse.MediaItem primaryImage,
        LocalDateTime createdAt
) {}

