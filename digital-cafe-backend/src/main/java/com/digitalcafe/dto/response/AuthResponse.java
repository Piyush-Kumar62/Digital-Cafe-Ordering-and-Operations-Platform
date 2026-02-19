package com.digitalcafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for authentication response including JWT token and user info.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    @Builder.Default
    private String tokenType = "Bearer";

    // ================= ACCOUNT STATUS =================

    private Long userId;
    private String username;
    private String email;
    private List<String> roles;
    private String status;
    private Boolean isEmailVerified;
    private Boolean isProfileComplete;
    private Integer profileCompletionPercentage;
    private String token;
    private String refreshToken;
    private String message;

}
