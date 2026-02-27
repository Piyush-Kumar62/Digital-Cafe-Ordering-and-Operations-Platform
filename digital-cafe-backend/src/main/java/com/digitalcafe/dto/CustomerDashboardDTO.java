package com.digitalcafe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDashboardDTO {

    // User Statistics
    private Long totalBookings;
    private Long totalOrders;
    private Long activeBookings;
    private Long upcomingBookings;

    // Order Statistics
    private Long completedOrders;
    private Long cancelledOrders;
    private BigDecimal totalAmountSpent;
    private BigDecimal currentMonthSpending;

    // Recent Activity
    private List<OrderDTO> recentOrders;
    private List<BookingDTO> recentBookings;
    private List<BookingDTO> upcomingBookingsList;

    // Favorite Items
    private List<MenuItemDTO> favoriteItems;

    // Profile Completion
    private Integer profileCompletionPercentage;

    // Loyalty Points (if applicable)
    private Integer loyaltyPoints;

    // Last Activity
    private LocalDateTime lastOrderDate;
    private LocalDateTime lastBookingDate;

    // Recommendations
    private List<MenuItemDTO> recommendedItems;

    // Statistics for charts
    private List<MonthlySpendingDTO> monthlySpending;
}
