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
    private PublicCafeCardResponse cafeDetails;
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
