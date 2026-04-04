package com.digitalcafe.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * DTO for café owner self-registration.
 * Cafe owners register without a password; the system sends a temporary password by email.
 */
@Data
public class CafeOwnerRegisterRequest {

    // Owner details

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    /**
     * Owner's personal mobile number (different from the café business phone).
     */
    @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Please provide a valid 10-digit Indian mobile number")
    private String ownerPhoneNumber;

    // Cafe details

    @NotBlank(message = "Café name is required")
    private String cafeName;

    private String description;

    @NotBlank(message = "Café address is required")
    private String address;

    @NotBlank(message = "City is required")
    private String city;

    private String state;

    @NotBlank(message = "Pincode is required")
    @Pattern(regexp = "^[0-9]{6}$", message = "Pincode must be exactly 6 digits")
    private String pincode;

    @NotBlank(message = "Business phone number is required")
    @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Please provide a valid 10-digit Indian mobile number")
    private String phoneNumber;

    // Optional operating hours

    private String openTime;

    private String closeTime;

    // Optional legal details

        @Pattern(regexp = "^$|^[0-9]{14}$", message = "FSSAI number must be exactly 14 digits")
        private String fssaiNumber;

        @Pattern(
            regexp = "^$|^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$",
            message = "GST number must be a valid 15-character GSTIN"
        )
        private String gstNumber;

        @Pattern(
            regexp = "^$|^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$",
            message = "MSME number must be in UDYAM-XX-00-0000000 format"
        )
        private String msmeNumber;
}
