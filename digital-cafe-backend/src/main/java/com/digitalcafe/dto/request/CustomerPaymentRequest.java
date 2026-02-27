package com.digitalcafe.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerPaymentRequest {
    @NotNull(message = "Order ID is required")
    private Long orderId;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod;
}
