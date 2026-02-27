package com.digitalcafe.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerOrderRequest {
    @NotNull(message = "Booking ID is required")
    private Long bookingId;

    @NotEmpty(message = "Order items cannot be empty")
    @Valid
    private List<CustomerOrderItemRequest> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerOrderItemRequest {
        @NotNull(message = "Menu ID is required")
        private Long menuId;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        @Max(value = 50, message = "Quantity must not exceed 50")
        private Integer quantity;
    }
}
