package com.digitalcafe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WaiterDashboardDTO {
    private Long readyOrders;
    private Long activeBookings;
    private Long servedTodayOrders;
    private List<OrderSummaryDTO> serviceQueue;
}
