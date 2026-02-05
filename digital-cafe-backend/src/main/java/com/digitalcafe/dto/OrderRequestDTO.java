package com.digitalcafe.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequestDTO {
    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Cafe ID is required")
    private Long cafeId;

    @NotNull(message = "Order type is required")
    private String orderType;

    private String specialInstructions;


    @NotNull(message = "Order items are required")
    private List<OrderItemRequestDTO> orderItems;
}
