package com.quickhelper.backend.exception;

// Thrown when an entity lookup fails
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
