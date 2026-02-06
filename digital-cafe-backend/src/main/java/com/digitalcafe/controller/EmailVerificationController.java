package com.digitalcafe.controller;

import com.digitalcafe.dto.EmailVerificationDTO;
import com.digitalcafe.service.EmailVerificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class EmailVerificationController {

    @Autowired
    private EmailVerificationService verificationService;

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody EmailVerificationDTO dto) {
        try {
            boolean verified = verificationService.verifyEmail(dto.getToken());
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Email verified successfully");
            response.put("data", Map.of("verified", verified));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    // Note: resend-verification endpoint is handled by AuthController to avoid duplicate mapping

    @PostMapping("/request-password-reset")
    public ResponseEntity<?> requestPasswordReset(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String token = verificationService.createPasswordResetToken(email);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Password reset email sent successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}
