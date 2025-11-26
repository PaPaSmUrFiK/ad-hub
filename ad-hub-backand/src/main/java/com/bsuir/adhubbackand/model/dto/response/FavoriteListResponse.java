package com.bsuir.adhubbackand.model.dto.response;

import java.util.List;

public record FavoriteListResponse(
        List<FavoriteResponse> favorites,
        long totalCount
) {}

