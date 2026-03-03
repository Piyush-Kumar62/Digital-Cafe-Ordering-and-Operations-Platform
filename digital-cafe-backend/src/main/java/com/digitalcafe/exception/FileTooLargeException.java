package com.digitalcafe.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.PAYLOAD_TOO_LARGE)
public class FileTooLargeException extends RuntimeException {

    public FileTooLargeException(String message) {
        super(message);
    }

    public FileTooLargeException(long maxSizeBytes) {
        super("File exceeds the maximum allowed size of " + (maxSizeBytes / (1024 * 1024)) + " MB");
    }
}
