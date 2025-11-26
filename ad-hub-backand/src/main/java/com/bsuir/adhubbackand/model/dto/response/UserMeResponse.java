package com.bsuir.adhubbackand.model.dto.response;

public record UserMeResponse(
        Long id,
        String email,
        String username,
        String role,
        Boolean isProfileFilled
) {}