package com.bsuir.adhubbackand.model.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

public record RegisterRequest(
        @NotBlank(message = "Email обязателен")
        @Email(message = "Некорректный формат email")
        String email,

        @NotBlank(message = "Пароль обязателен")
        @Size(min = 6, message = "Пароль должен содержать минимум 6 символов")
        String password,

        @NotBlank(message = "Имя пользователя обязательно")
        @Size(min = 3, max = 50, message = "Имя пользователя должно быть от 3 до 50 символов")
        @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Имя пользователя может содержать только буквы, цифры и подчеркивания")
        String username,

        @Size(max = 50, message = "Имя не должно превышать 50 символов")
        String firstName,

        @Size(max = 50, message = "Фамилия не должна превышать 50 символов")
        String lastName,

        @Size(max = 20, message = "Телефон не должен превышать 20 символов")
        @Pattern(regexp = "^\\+375 \\(\\d{2}\\) \\d{3}-\\d{2}-\\d{2}$", message = "Формат телефона: +375 (XX) XXX-XX-XX")
        String phone
) {}