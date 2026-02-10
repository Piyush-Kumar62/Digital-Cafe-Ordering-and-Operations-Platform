package com.digitalcafe.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for cafe creation and update request.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CafeRequest {

    @NotBlank(message = "Cafe name is required")
    @Size(max = 100)
    private String name;

    @Size(max = 1000)
    private String description;

    @NotBlank(message = "Address is required")
    @Size(max = 300)
    private String address;

    @NotBlank(message = "City is required")
    @Size(max = 100)
    private String city;

    @Size(max = 100)
    private String state;

    @NotBlank(message = "Pincode is required")
    @Size(max = 10)
    private String pincode;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10,20}$")
    private String phoneNumber;

    @Email
    @Size(max = 100)
    private String email;

    @Pattern(regexp = "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$", message = "Opening time must be in HH:MM format")
    private String openingTime;

    @Pattern(regexp = "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$", message = "Closing time must be in HH:MM format")
    private String closingTime;

    private String imageUrl;

    private Long ownerId; // Used by admin when creating cafe
}
