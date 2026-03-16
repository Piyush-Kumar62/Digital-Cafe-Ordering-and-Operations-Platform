package com.digitalcafe.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters")
    @Pattern(
            regexp = "^[A-Za-z][A-Za-z0-9._]{2,29}$",
            message = "Username must start with a letter and contain only letters, numbers, dots, and underscores"
    )
    private String username;

    @NotBlank(message = "Role is required")
    private String role; // ADMIN, CAFE_OWNER, CHEF, WAITER, CUSTOMER

    private String govtIdType;
    private String govtIdNumber;

    @Valid
    @NotNull(message = "Personal details are required")
    private PersonalDetailsRequest personalDetails;

    @Valid
    @NotNull(message = "Address is required")
    private AddressRequest address;

    @Valid
    @NotNull(message = "Academic information is required")
    private List<AcademicInfoRequest> academicInfoList;

    @Valid
    private List<WorkExperienceRequest> workExperienceList; // Optional
}
