package com.bsuir.adhubbackand.model.dto.request.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(
        @NotBlank(message = "Название категории обязательно")
        @Size(max = 100, message = "Название категории не должно превышать 100 символов")
        String name,

        @Size(max = 1000, message = "Описание не должно превышать 1000 символов")
        String description
) {}

