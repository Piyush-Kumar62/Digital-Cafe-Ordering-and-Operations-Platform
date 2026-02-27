package com.digitalcafe.exception;

/**
 * Exception thrown when a booking conflicts with an existing reservation.
 */
public class BookingConflictException extends RuntimeException {

    public BookingConflictException(String message) {
        super(message);
    }
}
