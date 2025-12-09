package com.bsuir.adhubbackand.exception;

public class EmailAlreadyExistsException extends RuntimeException {
    public EmailAlreadyExistsException(String email) {
        super("Пользователь с таким email уже зарегистрирован");
    }
}