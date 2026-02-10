package com.digitalcafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for cafe response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CafeResponse {

    private Long id;
    private String name;
    private String description;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String phoneNumber;
    private String email;
    private String openingTime;
    private String closingTime;
    private Boolean isActive;
    private String imageUrl;
    private Double rating;
    private Long ownerId;
    private String ownerName;
    private Integer totalTables;
    private Integer availableTables;
    private Integer totalMenuItems;
    private LocalDateTime createdAt;
}
