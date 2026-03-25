package com.digitalcafe.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PostalLookupResponseDTO {
    private String status;
    private PostalLookupData data;

    @Data
    @Builder
    public static class PostalLookupData {
        private List<String> cities;
        private List<String> states;
    }

    public static PostalLookupResponseDTO success(List<String> cities, List<String> states) {
        return PostalLookupResponseDTO.builder()
                .status("success")
                .data(PostalLookupData.builder().cities(cities).states(states).build())
                .build();
    }

    public static PostalLookupResponseDTO notFound() {
        return PostalLookupResponseDTO.builder().status("not_found").build();
    }

    public static PostalLookupResponseDTO error() {
        return PostalLookupResponseDTO.builder().status("error").build();
    }
}
