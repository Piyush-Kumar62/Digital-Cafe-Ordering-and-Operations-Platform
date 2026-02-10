package com.digitalcafe.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for order status update request.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private String status; // PREPARING, READY, SERVED

    private String remarks;

    private Long staffId; // Chef or waiter ID

    private String reason; // Cancellation reason
}
