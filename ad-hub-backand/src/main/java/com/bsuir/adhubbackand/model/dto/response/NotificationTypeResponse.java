package com.bsuir.adhubbackand.model.dto.response;

public record NotificationTypeResponse(
        Long id,
        String name,
        String template,
        String description
) {}


