package com.digitalcafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for dashboard statistics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    // Admin Dashboard
    private AdminDashboard adminDashboard;

    // Cafe Owner Dashboard
    private CafeOwnerDashboard cafeOwnerDashboard;

    // Chef Dashboard
    private ChefDashboard chefDashboard;

    // Waiter Dashboard
    private WaiterDashboard waiterDashboard;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminDashboard {
        private Long totalUsers;
        private Long totalCafes;
        private Long totalCafeOwners;
        private Long totalCustomers;
        private Long activeCafes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CafeOwnerDashboard {
        private Long totalBookings;
        private Long totalOrders;
        private Long pendingOrders;
        private Long completedOrders;
        private BigDecimal totalRevenue;
        private Long totalTables;
        private Long availableTables;
        private Long totalMenuItems;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChefDashboard {
        private Long newOrders;
        private Long ordersInProgress;
        private Long completedToday;
        private Long totalOrdersHandled;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WaiterDashboard {
        private Long readyOrders;
        private Long servedToday;
        private Long totalOrdersServed;
    }
}
