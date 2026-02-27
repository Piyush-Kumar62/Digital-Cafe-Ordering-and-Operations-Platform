package com.digitalcafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for user response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private Boolean isActive;
    private Boolean isEmailVerified;
    private Boolean isProfileComplete;
    private Integer profileCompletionPercentage;
    private Boolean mustResetPassword;
    private List<String> roles;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    private Long cafeId;
    private String cafeName;
    private String registrationStatus;
}
