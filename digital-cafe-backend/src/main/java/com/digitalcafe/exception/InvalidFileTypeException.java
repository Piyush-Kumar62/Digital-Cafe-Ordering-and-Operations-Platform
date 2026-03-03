package com.digitalcafe.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.Collection;

@ResponseStatus(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
public class InvalidFileTypeException extends RuntimeException {

    public InvalidFileTypeException(String message) {
        super(message);
    }

    public InvalidFileTypeException(String receivedType, Collection<String> allowedTypes) {
        super("File type '" + receivedType + "' is not allowed. Accepted types: " + String.join(", ", allowedTypes));
    }
}
