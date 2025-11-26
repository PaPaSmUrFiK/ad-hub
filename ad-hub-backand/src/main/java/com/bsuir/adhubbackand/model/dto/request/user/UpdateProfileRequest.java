package com.bsuir.adhubbackand.model.dto.request.user;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

public record UpdateProfileRequest(
        @Size(min = 3, max = 50, message = "Имя пользователя должно быть от 3 до 50 символов")
        @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Имя пользователя может содержать только буквы, цифры и подчеркивания")
        String username,

        @Size(max = 50, message = "Имя не должно превышать 50 символов")
        String firstName,

        @Size(max = 50, message = "Фамилия не должна превышать 50 символов")
        String lastName,

        @Size(max = 20, message = "Телефон не должен превышать 20 символов")
        @Pattern(regexp = "^$|^\\+375 \\(\\d{2}\\) \\d{3}-\\d{2}-\\d{2}$", message = "Формат телефона: +375 (XX) XXX-XX-XX")
        String phone
) {}
