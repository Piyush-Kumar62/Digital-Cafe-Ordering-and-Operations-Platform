package com.digitalcafe.dto;

import com.digitalcafe.dto.response.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffCreationResponse {
    private UserResponse user;
    private String temporaryPassword;
    private String message;
}
