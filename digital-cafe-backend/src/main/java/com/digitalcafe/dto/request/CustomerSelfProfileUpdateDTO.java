package com.digitalcafe.dto.request;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CustomerSelfProfileUpdateDTO {

    @Size(max = 100, message = "First name must be at most 100 characters")
    private String firstName;

    @Size(max = 100, message = "Last name must be at most 100 characters")
    private String lastName;

    @Size(max = 150, message = "Display name must be at most 150 characters")
    private String displayName;

    @Pattern(regexp = "^$|^[0-9]{10}$", message = "Phone number must be exactly 10 digits")
    private String phoneNumber;
    private LocalDate dateOfBirth;
    private String gender;
    private String govtIdType;

    @Size(max = 20, message = "Government ID number must be at most 20 characters")
    @Pattern(regexp = "^$|^[A-Za-z0-9-]{4,20}$", message = "Government ID number must be 4 to 20 valid characters")
    private String govtIdNumber;
    private AddressUpdateDTO address;

    private LocalDate joiningDate;
    private Integer experienceYears;
    private String shift;

    @Data
    public static class AddressUpdateDTO {
        private String street;
        private String plotNumber;
        private String city;
        private String state;
        private String country;
        private String pincode;
    }
}
