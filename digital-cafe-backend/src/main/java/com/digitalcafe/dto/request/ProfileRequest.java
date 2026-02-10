package com.digitalcafe.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for profile completion and update request.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileRequest {

    @NotBlank(message = "First name is required")
    @Size(max = 50)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 50)
    private String lastName;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @NotNull(message = "Gender is required")
    private String gender;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10,20}$", message = "Phone number must be valid")
    private String phoneNumber;

    private String profilePictureUrl;

    @NotNull(message = "Address is required")
    @Valid
    private AddressRequest address;

    @NotEmpty(message = "At least one academic record is required")
    @Valid
    private List<AcademicInfoRequest> academicInformation;

    @Valid
    private List<WorkExperienceRequest> workExperiences;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddressRequest {

        @NotBlank(message = "Street is required")
        @Size(max = 200)
        private String street;

        @Size(max = 50)
        private String plotNumber;

        @NotBlank(message = "City is required")
        @Size(max = 100)
        private String city;

        @Size(max = 100)
        private String state;

        @Size(max = 100)
        private String country;

        @NotBlank(message = "Pincode is required")
        @Size(max = 10)
        private String pincode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AcademicInfoRequest {

        @NotBlank(message = "Institution name is required")
        @Size(max = 200)
        private String institutionName;

        @NotBlank(message = "Degree is required")
        @Size(max = 100)
        private String degree;

        @Size(max = 100)
        private String fieldOfStudy;

        private LocalDate startDate;

        private LocalDate endDate;

        @Size(max = 20)
        private String grade;

        private Boolean isCurrent;

        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkExperienceRequest {

        @NotBlank(message = "Company name is required")
        @Size(max = 200)
        private String companyName;

        @NotBlank(message = "Position is required")
        @Size(max = 100)
        private String position;

        @NotNull(message = "Start date is required")
        private LocalDate startDate;

        private LocalDate endDate;

        private Boolean isCurrent;

        @Size(max = 100)
        private String location;

        private String description;

        private String responsibilities;
    }
}
