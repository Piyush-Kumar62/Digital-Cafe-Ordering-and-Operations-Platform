package com.digitalcafe.dto.request;

import com.digitalcafe.entity.Profile;
import com.digitalcafe.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

/**
 * DTO for creating staff accounts (Chef, Waiter) by Cafe Owner.
 * Cafe will be resolved from logged-in owner (NOT passed from frontend).
 */
@Data
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateStaffRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank(message = "Email is required")
    @Email
    private String email;

    @NotBlank(message = "First name is required")
    @Size(max = 50)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 50)
    private String lastName;

    // ===== Staff Employment Fields =====
    private String govtIdType;
    private String govtIdNumber;

    private LocalDate joiningDate;
    private Integer experienceYears;
    private String shift;

    private String phone;
    private Profile.Gender gender;
    private LocalDate dateOfBirth;

    /**
     * Must be CHEF or WAITER only.
     */
    @NotBlank(message = "Role is required")
    private String role;
}