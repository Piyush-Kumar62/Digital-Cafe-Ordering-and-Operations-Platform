package com.digitalcafe.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * DTO for café owner self-registration.
 * Unlike staff registration (which requires academic/work info),
 * café owners do NOT supply a password — a secure temporary password is
 * auto-generated and emailed to them so they can log in and reset it.
 * A Café entity is created alongside the User in a single registration call.
 */
@Data
public class CafeOwnerRegisterRequest {

    // ── Owner personal information ─────────────────────────────────────────

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

    // ── Café details ───────────────────────────────────────────────────────

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

    // ── Operating hours (optional) ─────────────────────────────────────────

    private String openTime;

    private String closeTime;

    // ── Legal / compliance numbers (all optional) ──────────────────────────

    private String fssaiNumber;

    private String gstNumber;

    private String msmeNumber;
}
