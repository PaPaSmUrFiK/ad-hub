package com.bsuir.adhubbackand.model.dto.response;

import java.util.List;

public record AdListResponse(
        List<AdResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext,
        boolean hasPrevious
) {}

