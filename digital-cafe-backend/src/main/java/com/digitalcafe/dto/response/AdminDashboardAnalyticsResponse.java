package com.digitalcafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardAnalyticsResponse {
    private Long totalUsers;
    private Long activeUsers;
    private Long inactiveUsers;
    private Long unverifiedEmailUsers;
    private Long usersWithoutPasswordReset;
    private Long todayNewRegistrations;
    private Map<String, Long> usersByRole;
    private List<WeeklyGrowthPoint> weeklyGrowth;
    private List<WeeklyRegistrationPoint> weeklyRegistrationGrowth;
    private List<RecentActivityPoint> recentActivities;
    private Long totalCafes;
    private Long activeCafes;
    private Long inactiveCafes;
    private Long totalBookings;
    private Long todayBookings;
    private Long pendingBookings;
    private Long confirmedBookings;
    private Long totalOrders;
    private Long todayOrders;
    private Long pendingOrders;
    private RevenueSummary revenueSummary;
    private Double totalRevenue;
    private Double todayRevenue;
    private Double thisMonthRevenue;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeeklyRegistrationPoint {
        private String date;
        private Long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeeklyGrowthPoint {
        private String date;
        private Long newUsers;
        private Long newBookings;
        private Long newOrders;
        private Double revenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivityPoint {
        private String activityType;
        private String description;
        private String timestamp;
        private String userRole;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueSummary {
        private Double totalRevenue;
        private Double todayRevenue;
        private Double thisMonthRevenue;
    }
}
