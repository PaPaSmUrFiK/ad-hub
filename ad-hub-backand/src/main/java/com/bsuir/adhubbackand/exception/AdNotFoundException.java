package com.bsuir.adhubbackand.exception;

public class AdNotFoundException extends RuntimeException {
    public AdNotFoundException(String message) {
        super(message);
    }
    
    public AdNotFoundException(Long adId) {
        super("Объявление с ID " + adId + " не найдено");
    }
}

