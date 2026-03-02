package com.digitalcafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicCafeDetailResponse {
    private Long id;
    private String name;
    private String description;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String phoneNumber;
    private String email;
    private String openTime;
    private String closeTime;
    private String logoUrl;
    private String coverUrl;
    private List<String> galleryImages;
    private java.time.LocalDateTime createdAt;
    
    private List<PublicMenuItemResponse> menuItems;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PublicMenuItemResponse {
        private Long id;
        private String name;
        private String description;
        private String category;
        private BigDecimal price;
        private String imageUrl;
        private Boolean available;
    }
}
