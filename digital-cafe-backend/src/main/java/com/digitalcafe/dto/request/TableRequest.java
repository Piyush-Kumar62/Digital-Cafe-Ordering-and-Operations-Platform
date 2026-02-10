package com.digitalcafe.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for cafe table creation and update request.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TableRequest {

    @NotBlank(message = "Table number is required")
    @Size(max = 20)
    private String tableNumber;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    @Max(value = 20, message = "Capacity must not exceed 20")
    private Integer capacity;

    @Size(max = 100)
    private String locationDescription;

    private String tableType; // REGULAR, VIP, OUTDOOR, PRIVATE
}
