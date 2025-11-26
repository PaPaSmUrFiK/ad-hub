package com.bsuir.adhubbackand.model.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record UserRatingsResponse(
        BigDecimal averageRating,
        Integer totalCount,
        List<RatingItem> items
) {
    public record RatingItem(
            Long fromUserId,
            String fromUserUsername,
            Integer score,
            String comment,
            String date
    ) {}
}