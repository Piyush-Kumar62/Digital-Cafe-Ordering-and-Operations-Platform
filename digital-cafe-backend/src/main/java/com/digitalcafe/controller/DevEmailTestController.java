package com.digitalcafe.controller;

import com.digitalcafe.service.EmailService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

@RestController
@Validated
@RequiredArgsConstructor
@Profile("dev")
@ConditionalOnProperty(name = "app.email.test-endpoint.enabled", havingValue = "true")
@RequestMapping("/api/public/dev")
public class DevEmailTestController {

    private final EmailService emailService;

    @GetMapping("/test-email")
    public Map<String, Object> sendTestEmail(
            @RequestParam @NotBlank @Email String to,
            @RequestParam(defaultValue = "order") String type,
            @RequestParam(defaultValue = "Test User") String name) {

        String normalizedType = type.trim().toLowerCase();
        String reference = "DEV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        switch (normalizedType) {
            case "otp" -> emailService.sendVerificationEmail(to, UUID.randomUUID().toString(), "123456");
            case "booking" -> emailService.sendBookingConfirmation(
                    to,
                    "Booking " + reference + " confirmed for 2 guests at 7:30 PM."
            );
            case "login" -> emailService.sendLoginNotification(
                    to,
                    name,
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"))
            );
            case "order" -> emailService.sendOrderConfirmation(
                    to,
                    "Order " + reference + " confirmed. ETA 25 minutes."
            );
            default -> throw new IllegalArgumentException("Invalid type. Use one of: otp, order, booking, login");
        }

        return Map.of(
                "success", true,
                "message", "Test email queued",
                "to", to,
                "type", normalizedType,
                "reference", reference
        );
    }
}
