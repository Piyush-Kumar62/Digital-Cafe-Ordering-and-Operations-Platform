package com.digitalcafe.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCafeRequest {
    
    @NotBlank(message = "Cafe name is required")
    private String name;
    
    private String description;
    
    @NotBlank(message = "Address is required")
    private String address;
    
    @NotBlank(message = "City is required")
    private String city;
    
    private String state;
    private String pincode;
    
    @NotBlank(message = "Phone number is required")
    private String phone;
    
    @Email(message = "Invalid email format")
    private String email;
    
    private String openingTime;
    private String closingTime;
    private String imageUrl;
    
    @NotNull(message = "Owner ID is required")
    private Long ownerId;
    
    private Boolean active = true;
}
