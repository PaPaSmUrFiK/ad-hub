package com.bsuir.adhubbackand.model.dto.response;

public record AdMediaResponse(
        Long id,
        String fileUrl,
        String fileType,
        Boolean isPrimary,
        Integer displayOrder
) {}

