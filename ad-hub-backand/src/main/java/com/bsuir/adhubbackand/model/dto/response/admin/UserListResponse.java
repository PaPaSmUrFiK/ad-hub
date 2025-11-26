package com.bsuir.adhubbackand.model.dto.response.admin;

import com.bsuir.adhubbackand.model.enums.UserStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record UserListResponse(
        List<UserListItem> users,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext,
        boolean hasPrevious
) {
    public record UserListItem(
            Long id,
            String username,
            String email,
            String firstName,
            String lastName,
            String phone,
            String roleName,
            UserStatus status,
            BigDecimal rating,
            LocalDateTime createdAt,
            LocalDateTime lastLogin,
            long adsCount
    ) {}
}

