package com.bsuir.adhubbackand.model.enums;

public enum SortBy {
    PRICE_ASC("price", "ASC"),
    PRICE_DESC("price", "DESC"),
    DATE_ASC("createdAt", "ASC"),
    DATE_DESC("createdAt", "DESC"),
    POPULARITY_DESC("viewCount", "DESC");

    private final String field;
    private final String direction;

    SortBy(String field, String direction) {
        this.field = field;
        this.direction = direction;
    }

    public String getField() {
        return field;
    }

    public String getDirection() {
        return direction;
    }
}

