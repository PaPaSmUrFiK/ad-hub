package com.bsuir.adhubbackand.exception;

public class NotificationNotFoundException extends RuntimeException {
    public NotificationNotFoundException(String message) {
        super(message);
    }

    public NotificationNotFoundException(Long notificationId) {
        super("Уведомление с ID " + notificationId + " не найдено");
    }
}

