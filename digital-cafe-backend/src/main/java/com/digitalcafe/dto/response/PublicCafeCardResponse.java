package com.digitalcafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicCafeCardResponse {
    private Long id;
    private String name;
    private String city;
    private String state;
    private String description;
    private String openTime;
    private String closeTime;
    private Double rating;
    private String logoUrl;
    private String imageUrl;
}
