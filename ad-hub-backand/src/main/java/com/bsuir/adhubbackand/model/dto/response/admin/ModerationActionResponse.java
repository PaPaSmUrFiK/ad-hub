package com.bsuir.adhubbackand.model.dto.response.admin;

import com.bsuir.adhubbackand.model.enums.AdStatus;

public record ModerationActionResponse(
        Long adId,
        AdStatus newStatus,
        String message
) {}

