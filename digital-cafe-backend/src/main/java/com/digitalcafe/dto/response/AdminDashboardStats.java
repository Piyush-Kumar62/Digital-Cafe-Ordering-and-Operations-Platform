package com.digitalcafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Response DTO for admin dashboard statistics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStats {
    
    // User Statistics
    private Long totalUsers;
    private Long activeUsers;
    private Long inactiveUsers;
    private Long unverifiedEmailUsers;
    private Long usersWithoutPasswordReset;
    private Long todayNewRegistrations;
    private Long thisWeekRegistrations;
    private Long thisMonthRegistrations;
    
    // Cafe Statistics
    private Long totalCafes;
    private Long activeCafes;
    private Long inactiveCafes;
    
    // Booking Statistics
    private Long totalBookings;
    private Long todayBookings;
    private Long pendingBookings;
    private Long confirmedBookings;
    
    // Order Statistics
    private Long totalOrders;
    private Long todayOrders;
    private Long pendingOrders;
    private Long completedOrders;
    
    // Revenue Statistics
    private Double totalRevenue;
    private Double todayRevenue;
    private Double thisMonthRevenue;
    
    // User Category Breakdown (Pie Chart Data)
    private Map<String, Long> usersByRole;
    
    // Weekly Growth Data (Bar Chart Data)
    private List<WeeklyGrowthData> weeklyGrowth;
    
    // Recent Activities
    private List<RecentActivity> recentActivities;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeeklyGrowthData {
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
    public static class RecentActivity {
        private String activityType;
        private String description;
        private String timestamp;
        private String userRole;
    }
}
