package com.digitalcafe.controller;

import com.digitalcafe.dto.request.ChangePasswordRequest;
import com.digitalcafe.dto.request.CafeOwnerRegisterRequest;
import com.digitalcafe.dto.request.LoginRequest;
import com.digitalcafe.dto.request.SimpleRegisterRequest;
import com.digitalcafe.dto.request.RegisterRequest;
import com.digitalcafe.dto.request.ResetPasswordRequest;
import com.digitalcafe.dto.response.AuthResponse;
import com.digitalcafe.dto.response.RegisterResponse;
import com.digitalcafe.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.digitalcafe.security.CookieUtil;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CookieUtil cookieUtil;

    @PostMapping("/simple-register")
    public ResponseEntity<AuthResponse> simpleRegister(@Valid @RequestBody SimpleRegisterRequest request, HttpServletResponse servletResponse) {
        AuthResponse response = authService.register(request);
        applyAuthCookies(servletResponse, response);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.comprehensiveRegister(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Café owner self-registration endpoint.
     * Accepts multipart/form-data: JSON data part + optional logo file.
     * Creates both the User (CAFE_OWNER role) and the Café entity in one transaction.
     */
    @PostMapping(value = "/register/cafe-owner", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AuthResponse> registerCafeOwner(
            @Valid @RequestPart("data") CafeOwnerRegisterRequest request,
            @RequestPart(value = "logo", required = false) MultipartFile logo,
            @RequestPart(value = "galleryImages", required = false) MultipartFile[] galleryImages,
            HttpServletResponse servletResponse) {
        List<MultipartFile> images = galleryImages == null ? List.of() : Arrays.asList(galleryImages);
        AuthResponse response = authService.registerCafeOwner(request, logo, images);
        applyAuthCookies(servletResponse, response);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletResponse servletResponse) {
        AuthResponse response = authService.login(request);
        applyAuthCookies(servletResponse, response);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(Map.of("message", "Email verified successfully"));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(@RequestParam String email) {
        authService.resendVerificationEmail(email);
        return ResponseEntity.ok(Map.of("message", "Verification email sent"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestParam String email) {
        authService.forgotPassword(email);
        return ResponseEntity.ok(Map.of("message", "Password reset link sent to your email"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @RequestParam String token,
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(token, request);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        authService.changePassword(username, request.getOldPassword(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(
            @CookieValue(name = "refreshToken") String refreshToken, 
            HttpServletResponse servletResponse) {
        AuthResponse response = authService.refreshToken(refreshToken);
        applyAuthCookies(servletResponse, response);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/username-available")
    public ResponseEntity<Map<String, Object>> usernameAvailable(@RequestParam String username) {
        boolean available = authService.isUsernameAvailable(username);
        return ResponseEntity.ok(Map.of("available", available));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletResponse servletResponse) {
        SecurityContextHolder.clearContext();
        addHeaders(servletResponse, cookieUtil.clearRefreshTokenCookie());
        addHeaders(servletResponse, cookieUtil.clearAccessTokenCookie());
        addHeaders(servletResponse, cookieUtil.clearCsrfCookie());
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    private void applyAuthCookies(HttpServletResponse servletResponse, AuthResponse response) {
        if (response == null) {
            return;
        }
        if (response.getRefreshToken() != null && !response.getRefreshToken().isBlank()) {
            addHeaders(servletResponse, cookieUtil.createRefreshTokenCookie(response.getRefreshToken()));
        }
        if (response.getToken() != null && !response.getToken().isBlank()) {
            addHeaders(servletResponse, cookieUtil.createAccessTokenCookie(response.getToken()));
            addHeaders(servletResponse, cookieUtil.createCsrfCookie());
        }
    }

    private void addHeaders(HttpServletResponse servletResponse, HttpHeaders headers) {
        headers.forEach((key, values) -> values.forEach(value -> servletResponse.addHeader(key, value)));
    }
}

