package com.digitalcafe.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateUserRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    private Long cafeId; // For chef and waiter

    // Optional cafe details for admin owner onboarding in a single step.
    private String cafeName;
    private String cafeDescription;
    private String cafeAddress;
    private String cafeCity;
    private String cafeState;
    private String cafePincode;
    private String cafePhoneNumber;
    private String cafeEmail;
    private String openingTime;
    private String closingTime;
}
