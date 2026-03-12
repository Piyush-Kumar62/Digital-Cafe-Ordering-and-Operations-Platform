package com.digitalcafe.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChefDashboardDTO {
    private Long cafeId;
    private String cafeName;
    private Long pendingOrders;
    private Long preparingOrders;
    private Long completedToday;
    private List<OrderSummaryDTO> recentOrders;
}
