package com.bsuir.adhubbackand.model.dto.response;

import java.time.LocalDateTime;

public record UserProfileResponse(
        Long id,
        String username,
        String email,
        String firstName,
        String lastName,
        String phone,
        String avatarUrl,
        String role,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}