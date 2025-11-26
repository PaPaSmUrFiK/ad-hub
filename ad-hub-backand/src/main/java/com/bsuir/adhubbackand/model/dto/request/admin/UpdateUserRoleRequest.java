package com.bsuir.adhubbackand.model.dto.request.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateUserRoleRequest(
        @NotBlank(message = "Роль обязательна")
        @Pattern(regexp = "^(USER|MODERATOR|ADMIN)$", message = "Роль должна быть USER, MODERATOR или ADMIN")
        String roleName
) {}

