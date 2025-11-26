package com.bsuir.adhubbackand.model.dto.request.auth;

import jakarta.validation.constraints.NotBlank;

public record LogoutRequest(
        @NotBlank(message = "Refresh токен обязателен")
        String refreshToken
) {}