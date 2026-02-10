package com.digitalcafe.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;

    @NotBlank(message = "Role is required")
    private String role; // ADMIN, CAFE_OWNER, CHEF, WAITER, CUSTOMER

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
