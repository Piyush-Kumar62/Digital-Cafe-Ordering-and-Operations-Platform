package com.digitalcafe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaffCreationResponse {
    private Long id;
    private String username;
    private String email;
    private String role;
    private String tempPassword; // Only sent once during creation
    private boolean active;
    private boolean emailVerified;
    private boolean profileCompleted;
}
