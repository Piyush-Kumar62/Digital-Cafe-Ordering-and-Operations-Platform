package com.digitalcafe.dto.response;

import com.digitalcafe.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class CustomerSelfProfileResponseDTO {
    private String firstName;
    private String lastName;
    private String displayName;
    private String email;
    private String role;
    private String profileImageUrl;
    private String phoneNumber;
    private LocalDate dateOfBirth;
    private String gender;
    private String govtIdType;
    private String govtIdNumber;
    private String govtIdFileName;
    private String govtIdContentType;
    private String govtIdDocumentPath;
    private Long govtIdFileSize;
    private ProfileAddressResponse address;
    private LocalDate joiningDate;
    private Integer experienceYears;
    private String shift;
    private User.AccountStatus accountStatus;
    private Boolean emailVerified;
    private Integer profileCompletionPercentage;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;

    @Data
    @Builder
    public static class ProfileAddressResponse {
        private String street;
        private String plotNumber;
        private String city;
        private String state;
        private String country;
        private String pincode;
    }
}
