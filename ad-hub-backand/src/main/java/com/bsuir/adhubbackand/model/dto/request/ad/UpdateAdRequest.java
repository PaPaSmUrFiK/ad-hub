package com.bsuir.adhubbackand.model.dto.request.ad;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record UpdateAdRequest(
        @Size(min = 5, max = 200, message = "Заголовок должен быть от 5 до 200 символов")
        String title,

        @Size(min = 10, max = 5000, message = "Описание должно быть от 10 до 5000 символов")
        String description,

        @PositiveOrZero(message = "Цена должна быть положительной или нулевой")
        @Digits(integer = 10, fraction = 2, message = "Цена должна иметь до 10 целых и 2 дробных цифр")
        BigDecimal price,

        @Size(max = 3, message = "Валюта не должна превышать 3 символов")
        String currency,

        @Size(max = 200, message = "Местоположение не должно превышать 200 символов")
        String location,

        @Positive(message = "ID категории должен быть положительным")
        Long categoryId
) {}

