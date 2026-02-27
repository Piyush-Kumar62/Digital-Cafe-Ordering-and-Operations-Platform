package com.digitalcafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterResponse {

    private String message;
    private Long userId;
    private String username;
    private String email;
    private String role;
    private Boolean emailVerified;
    private Boolean profileCompleted;
    private Integer profileCompletionPercentage;
}
