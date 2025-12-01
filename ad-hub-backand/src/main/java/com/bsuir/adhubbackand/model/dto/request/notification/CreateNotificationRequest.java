package com.bsuir.adhubbackand.model.dto.request.notification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateNotificationRequest(
        @NotNull(message = "ID пользователя обязателен")
        Long userId,
        
        @NotNull(message = "ID типа уведомления обязателен")
        Long notificationTypeId,
        
        @NotBlank(message = "Заголовок обязателен")
        @Size(max = 200, message = "Заголовок не должен превышать 200 символов")
        String title,
        
        @NotBlank(message = "Сообщение обязательно")
        @Size(max = 2000, message = "Сообщение не должно превышать 2000 символов")
        String message,
        
        Long relatedAdId
) {}

