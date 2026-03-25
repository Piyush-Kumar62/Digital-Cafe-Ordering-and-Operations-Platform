package com.digitalcafe.controller;

import com.digitalcafe.dto.request.CafeOwnerRegisterRequest;
import com.digitalcafe.dto.response.AuthResponse;
import com.digitalcafe.entity.EmailVerificationToken;
import com.digitalcafe.entity.PasswordResetToken;
import com.digitalcafe.entity.User;
import com.digitalcafe.repository.EmailVerificationTokenRepository;
import com.digitalcafe.repository.PasswordResetTokenRepository;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.AuthService;
import com.digitalcafe.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Test-only endpoints used by Cypress API workflows in the e2e profile.
 * These endpoints are never active in dev/prod profiles.
 */
@RestController
@Profile("e2e")
@RequestMapping("/api/public/e2e")
@RequiredArgsConstructor
public class E2ETestSupportController {

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/register-cafe-owner")
    public ResponseEntity<AuthResponse> registerCafeOwner(@RequestBody CafeOwnerRegisterRequest request) {
        return ResponseEntity.ok(authService.registerCafeOwner(request, null, java.util.List.of()));
    }

    @GetMapping("/email-token")
    public ResponseEntity<Map<String, String>> emailToken(@RequestParam String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found for email: " + email));

        String token = emailVerificationTokenRepository
                .findFirstByUserIdAndIsUsedFalseOrderByCreatedAtDesc(user.getId())
                .map(EmailVerificationToken::getToken)
                .orElseThrow(() -> new IllegalArgumentException("No email verification token found for: " + email));

        return ResponseEntity.ok(Map.of("token", token));
    }

    @GetMapping("/password-reset-token")
    public ResponseEntity<Map<String, String>> passwordResetToken(@RequestParam String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found for email: " + email));

        String token = passwordResetTokenRepository.findByUserAndIsUsedFalse(user)
                .map(PasswordResetToken::getToken)
                .orElseThrow(() -> new IllegalArgumentException("No password reset token found for: " + email));

        return ResponseEntity.ok(Map.of("token", token));
    }

    @PostMapping("/approve-user")
    public ResponseEntity<Map<String, String>> approveUser(@RequestParam String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found for email: " + email));
        userService.approveUser(user.getId());
        return ResponseEntity.ok(Map.of("status", "APPROVED"));
    }
}
