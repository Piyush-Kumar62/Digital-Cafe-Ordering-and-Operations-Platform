package com.digitalcafe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecentUserDTO {
    private Long id;
    private String username;
    private String email;
    private String role;
    private Boolean emailVerified;
    private Boolean profileCompleted;
    private String createdAt;
}
