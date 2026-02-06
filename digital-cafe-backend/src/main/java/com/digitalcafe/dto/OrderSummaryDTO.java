package com.digitalcafe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderSummaryDTO {
    private Long id;
    private String orderNumber;
    private String customerName;
    private String status;
    private BigDecimal totalAmount;
    private String tableNumber;
    private String createdAt;
}
