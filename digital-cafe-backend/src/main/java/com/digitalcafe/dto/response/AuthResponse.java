package com.digitalcafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.List;

/**
 * DTO for authentication response including JWT token and user info.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;
    @JsonIgnore
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long userId;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private Long cafeId;
    private List<String> roles;
    private Boolean isEmailVerified;
    private Boolean isProfileComplete;
    private Integer profileCompletionPercentage;
    private Boolean mustResetPassword;
    private String message;
}
