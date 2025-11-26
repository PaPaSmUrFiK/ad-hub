package com.bsuir.adhubbackand.exception;

public class CommentNotFoundException extends RuntimeException {
    public CommentNotFoundException(String message) {
        super(message);
    }
    
    public CommentNotFoundException(Long commentId) {
        super("Комментарий с ID " + commentId + " не найден");
    }
}

