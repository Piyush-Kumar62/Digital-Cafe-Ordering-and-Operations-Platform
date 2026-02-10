package com.digitalcafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for cafe table response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TableResponse {

    private Long id;
    private String tableNumber;
    private Integer capacity;
    private Boolean isAvailable;
    private String locationDescription;
    private String tableType;
    private String displayName;
    private Long cafeId;
    private String cafeName;
}
