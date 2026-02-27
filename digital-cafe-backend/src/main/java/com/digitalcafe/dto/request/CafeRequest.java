package com.digitalcafe.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

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


    @JsonFormat(pattern = "HH:mm")
    private LocalTime openingTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime closingTime;

    private String imageUrl;
    @NotBlank(message = "Fssai number is required")
    private String fssaiNumber;
    @NotBlank(message = "GSTNo: number is required")
    private String gstNumber;

    @NotBlank(message = "Phone number is required")
    private String msmeNumber;


    private Long ownerId; // Used by admin when creating cafe
}
