package com.bsuir.adhubbackand.model.dto.request.user;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserRatingRequest(
        @NotNull(message = "Оценка обязательна")
        @Min(value = 1, message = "Оценка должна быть не менее 1")
        @Max(value = 5, message = "Оценка должна быть не более 5")
        Integer score,

        @Size(max = 500, message = "Комментарий не должен превышать 500 символов")
        String comment
) {}
