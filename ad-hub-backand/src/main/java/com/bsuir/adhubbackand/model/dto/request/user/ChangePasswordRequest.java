package com.bsuir.adhubbackand.model.dto.request.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        // Текущий пароль опционален (для администраторов или если пользователь уже авторизован)
        String currentPassword,

        @NotBlank(message = "Новый пароль обязателен")
        @Size(min = 6, message = "Новый пароль должен содержать минимум 6 символов")
        String newPassword
) {}
