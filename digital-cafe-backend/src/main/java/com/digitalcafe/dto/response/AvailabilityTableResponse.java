package com.digitalcafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight availability payload for booking slot checks.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityTableResponse {
    private Long tableId;
    private Integer capacity;
    private Boolean isAvailable;
}
