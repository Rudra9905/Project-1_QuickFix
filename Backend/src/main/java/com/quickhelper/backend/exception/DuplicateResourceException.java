package com.quickhelper.backend.exception;

// Thrown when attempting to create a resource that already exists
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}
