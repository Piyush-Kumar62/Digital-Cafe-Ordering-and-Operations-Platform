package com.digitalcafe.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

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

    private Boolean isActive;

    // ✅ New branding fields
    private String logoUrl;
    private String coverUrl;

    // ✅ Gallery support
    private List<String> galleryImages;

    private Double rating;

    private Long ownerId;
    private String ownerName;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime openTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime closeTime;

    private Integer totalTables;
    private Integer availableTables;
    private Integer totalMenuItems;

    private String fssaiNumber;
    private String gstNumber;
    private String msmeNumber;
    private LocalDateTime createdAt;
}