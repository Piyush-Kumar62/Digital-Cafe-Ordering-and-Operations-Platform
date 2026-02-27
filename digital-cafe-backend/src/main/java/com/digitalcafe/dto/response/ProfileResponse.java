package com.digitalcafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for profile response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private LocalDate dateOfBirth;
    private String gender;
    private String phoneNumber;
    private String profilePictureUrl;
    private Integer completionPercentage;
    private AddressResponse address;
    private List<AcademicInfoResponse> academicInformation;
    private List<WorkExperienceResponse> workExperiences;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddressResponse {
        private Long id;
        private String street;
        private String plotNumber;
        private String city;
        private String state;
        private String country;
        private String pincode;
        private String fullAddress;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AcademicInfoResponse {
        private Long id;
        private String institutionName;
        private String degree;
        private String fieldOfStudy;
        private LocalDate startDate;
        private LocalDate endDate;
        private String grade;
        private Boolean isCurrent;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkExperienceResponse {
        private Long id;
        private String companyName;
        private String position;
        private LocalDate startDate;
        private LocalDate endDate;
        private Boolean isCurrent;
        private String location;
        private String description;
        private String responsibilities;
    }
}
