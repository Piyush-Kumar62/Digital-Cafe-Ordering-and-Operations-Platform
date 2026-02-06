package com.digitalcafe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileDTO {
    private Long id;
    private Long userId;
    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private String gender;
    private String phone;
    private String profilePictureUrl;
    private Integer completionPercentage;
    private List<AcademicInfoDTO> academicInfo;
    private List<WorkExperienceDTO> workExperience;
    private AddressDTO address;
}
