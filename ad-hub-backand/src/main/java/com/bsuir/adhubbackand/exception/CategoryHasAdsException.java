package com.bsuir.adhubbackand.exception;

public class CategoryHasAdsException extends RuntimeException {
    public CategoryHasAdsException(String message) {
        super(message);
    }
    
    public CategoryHasAdsException(Long categoryId) {
        super("Невозможно удалить категорию с ID " + categoryId + ", так как в ней есть объявления");
    }
}

