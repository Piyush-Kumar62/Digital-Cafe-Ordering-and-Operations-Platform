package com.digitalcafe.dto.request;

import com.digitalcafe.dto.request.AcademicInfoRequest;
import com.digitalcafe.dto.request.AddressRequest;
import com.digitalcafe.dto.request.PersonalDetailsRequest;
import com.digitalcafe.dto.request.WorkExperienceRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.util.List;

@Data

public class RegisterRequest {

    @NotNull(message = "Username is required")
    private String username;

    @NotNull(message = "Role is required")
    private String role;

    // ✅ NEW (Added for Government ID)
    @NotNull(message = "Government Id is Required")
    private String governmentIdType;
    @NotNull(message = "Government Id Number is Required")
    private String governmentIdNumber;

    @Valid
    @NotNull(message = "Personal details are required")
    private PersonalDetailsRequest personalDetails;

    @Valid
    @NotNull(message = "Address is required")
    private AddressRequest address;

    @Valid
    @NotNull(message = "Academic information is required")
    private List<AcademicInfoRequest> academicInfoList;

    private List<WorkExperienceRequest> workExperienceList;
}
