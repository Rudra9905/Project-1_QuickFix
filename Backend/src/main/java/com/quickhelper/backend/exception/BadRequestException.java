package com.quickhelper.backend.exception;

// Thrown when a request fails business validation
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
