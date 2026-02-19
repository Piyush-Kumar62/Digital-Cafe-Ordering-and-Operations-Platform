package com.digitalcafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for user response.
 * Used in all user-related APIs.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String username;
    private String email;

    // ================= STATUS =================

    private Boolean isActive;
    private Boolean isEmailVerified;
    private Boolean isProfileComplete;
    private Integer profileCompletionPercentage;
    private Boolean mustResetPassword;

    /**
     * NEW FIELD → approval lifecycle status
     * Values: PENDING / APPROVED / ACTIVE / REJECTED
     */
    private String status;

    // ================= ROLES =================

    private List<String> roles;

    // ================= META =================

    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;

    // ================= CAFE =================

    private Long cafeId;
    private String cafeName;
}
