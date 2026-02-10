package com.digitalcafe.exception;

/**
 * Custom exception for access denied scenarios.
 */
public class AccessDeniedException extends RuntimeException {

    public AccessDeniedException(String message) {
        super(message);
    }
}
