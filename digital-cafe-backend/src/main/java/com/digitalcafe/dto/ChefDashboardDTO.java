package com.digitalcafe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChefDashboardDTO {
    private Long pendingOrders;
    private Long preparingOrders;
    private Long completedTodayOrders;
    private Double averagePreparationTime;
    private List<OrderSummaryDTO> orderQueue;
}
