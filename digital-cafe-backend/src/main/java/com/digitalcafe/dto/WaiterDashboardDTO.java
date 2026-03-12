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
public class WaiterDashboardDTO {
    private Long cafeId;
    private String cafeName;
    private Long readyOrders;
    private Long activeOrders;
    private Long servedToday;
    private List<OrderSummaryDTO> recentOrders;
}
