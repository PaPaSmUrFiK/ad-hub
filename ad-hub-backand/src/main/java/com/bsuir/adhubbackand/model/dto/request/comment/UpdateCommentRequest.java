package com.bsuir.adhubbackand.model.dto.request.comment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateCommentRequest(
        @NotBlank(message = "Текст комментария обязателен")
        @Size(min = 1, max = 1000, message = "Комментарий должен быть от 1 до 1000 символов")
        String commentText
) {}

