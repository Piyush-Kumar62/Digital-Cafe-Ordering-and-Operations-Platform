package com.digitalcafe.dto.response;

import com.digitalcafe.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CustomerSelfProfileResponseDTO {
    private String firstName;
    private String lastName;
    private String displayName;
    private String email;
    private String role;
    private String profileImageUrl;
    private User.AccountStatus accountStatus;
    private Boolean emailVerified;
    private Integer profileCompletionPercentage;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
}
