package com.bsuir.adhubbackand.exception;

public class CategoryNotFoundException extends RuntimeException {
    public CategoryNotFoundException(String message) {
        super(message);
    }
    
    public CategoryNotFoundException(Long categoryId) {
        super("Категория с ID " + categoryId + " не найдена");
    }
}

