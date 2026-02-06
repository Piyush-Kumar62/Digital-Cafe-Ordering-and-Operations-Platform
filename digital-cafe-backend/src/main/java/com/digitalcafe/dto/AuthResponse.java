package com.digitalcafe.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private Long id;  // Added user ID
    private String token;
    @Builder.Default
    private String type = "Bearer";
    private String username;
    private String email;
    private String role;
    private Boolean emailVerified;
    private Boolean profileCompleted;
    private String message;
}
