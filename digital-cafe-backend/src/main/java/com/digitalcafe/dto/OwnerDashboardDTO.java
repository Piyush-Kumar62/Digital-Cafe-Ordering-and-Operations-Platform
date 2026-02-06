package com.digitalcafe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OwnerDashboardDTO {
    private Long totalTables;
    private Long totalMenuItems;
    private Long todayBookings;
    private Long todayOrders;
    private BigDecimal todayRevenue;
    private BigDecimal monthlyRevenue;
    private Long totalChefs;
    private Long totalWaiters;
    private List<PopularItemDTO> popularItems;
    private List<RevenueDataDTO> revenueChart;
}
