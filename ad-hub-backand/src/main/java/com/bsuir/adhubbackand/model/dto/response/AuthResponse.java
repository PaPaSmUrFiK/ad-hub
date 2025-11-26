package com.bsuir.adhubbackand.model.dto.response;

public record AuthResponse(
    String accessToken,
    String refreshToken
) {

}
