package com.digitalcafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerDashboardAnalyticsResponse {
    private Long totalBookings;
    private Long totalOrders;
    private BigDecimal revenue;
    private Map<String, Long> ordersByStatus;
    private Long activeTables;
}
