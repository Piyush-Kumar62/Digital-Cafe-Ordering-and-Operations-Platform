package com.digitalcafe.controller;

import com.digitalcafe.dto.request.ContactMessageRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Public contact form endpoint — no authentication required.
 * Accepts messages submitted from the /contact page.
 */
@Slf4j
@RestController
@RequestMapping("/api/public/contact")
public class ContactController {

    /**
     * Receive a contact form submission.
     * Logs the message and returns a confirmation response.
     */
    @PostMapping("/message")
    public ResponseEntity<Map<String, Object>> submitMessage(
            @Valid @RequestBody ContactMessageRequest request) {

        // Log for backend visibility
        log.info("=== Contact Form Submission ===");
        log.info("From    : {} <{}>", request.getName(), request.getEmail());
        log.info("Phone   : {}", request.getPhone() != null ? request.getPhone() : "N/A");
        log.info("Subject : {}", request.getSubject() != null ? request.getSubject() : "N/A");
        log.info("Message : {}", request.getMessage());
        log.info("At      : {}", LocalDateTime.now());
        log.info("==============================");

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Thank you, " + request.getName() + "! Your message has been received. We will get back to you shortly.");
        response.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.ok(response);
    }
}
