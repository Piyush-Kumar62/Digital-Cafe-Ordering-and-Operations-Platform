package com.digitalcafe.service;

import com.digitalcafe.dto.response.AdminDashboardStats;
import com.digitalcafe.entity.*;
import com.digitalcafe.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for calculating admin dashboard statistics.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final CafeRepository cafeRepository;
    private final BookingRepository bookingRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    public AdminDashboardStats getDashboardStats() {
        log.info("Fetching admin dashboard statistics");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        LocalDateTime startOfWeek = now.minusWeeks(1);
        LocalDateTime startOfMonth = now.withDayOfMonth(1).toLocalDate().atStartOfDay();

        // User Statistics
        Long totalUsers = userRepository.count();
        Long activeUsers = userRepository.countByIsActive(true);
        Long inactiveUsers = userRepository.countByIsActive(false);
        Long unverifiedEmailUsers = userRepository.countByIsEmailVerified(false);
        Long usersWithoutPasswordReset = userRepository.countByMustResetPassword(true);
        Long todayNewRegistrations = userRepository.countByCreatedAtAfter(startOfDay);
        Long thisWeekRegistrations = userRepository.countByCreatedAtAfter(startOfWeek);
        Long thisMonthRegistrations = userRepository.countByCreatedAtAfter(startOfMonth);

        // Cafe Statistics
        Long totalCafes = cafeRepository.count();
        Long activeCafes = cafeRepository.countByIsActive(true);
        Long inactiveCafes = cafeRepository.countByIsActive(false);

        // Booking Statistics
        Long totalBookings = bookingRepository.count();
        Long todayBookings = bookingRepository.countByCreatedAtAfter(startOfDay);
        Long pendingBookings = bookingRepository.countByStatus(Booking.BookingStatus.PENDING);
        Long confirmedBookings = bookingRepository.countByStatus(Booking.BookingStatus.CONFIRMED);

        // Order Statistics
        Long totalOrders = orderRepository.count();
        Long todayOrders = orderRepository.countByCreatedAtAfter(startOfDay);
        Long pendingOrders = orderRepository.countByStatus(Order.OrderStatus.PLACED);
        Long completedOrders = orderRepository.countByStatus(Order.OrderStatus.SERVED);

        // Revenue Statistics
        Double totalRevenue = calculateTotalRevenue();
        Double todayRevenue = calculateRevenueAfter(startOfDay);
        Double thisMonthRevenue = calculateRevenueAfter(startOfMonth);

        // User Category Breakdown
        Map<String, Long> usersByRole = getUsersByRole();

        // Weekly Growth Data
        List<AdminDashboardStats.WeeklyGrowthData> weeklyGrowth = getWeeklyGrowthData();

        // Recent Activities (last 10)
        List<AdminDashboardStats.RecentActivity> recentActivities = getRecentActivities();

        return AdminDashboardStats.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .inactiveUsers(inactiveUsers)
                .unverifiedEmailUsers(unverifiedEmailUsers)
                .usersWithoutPasswordReset(usersWithoutPasswordReset)
                .todayNewRegistrations(todayNewRegistrations)
                .thisWeekRegistrations(thisWeekRegistrations)
                .thisMonthRegistrations(thisMonthRegistrations)
                .totalCafes(totalCafes)
                .activeCafes(activeCafes)
                .inactiveCafes(inactiveCafes)
                .totalBookings(totalBookings)
                .todayBookings(todayBookings)
                .pendingBookings(pendingBookings)
                .confirmedBookings(confirmedBookings)
                .totalOrders(totalOrders)
                .todayOrders(todayOrders)
                .pendingOrders(pendingOrders)
                .completedOrders(completedOrders)
                .totalRevenue(totalRevenue)
                .todayRevenue(todayRevenue)
                .thisMonthRevenue(thisMonthRevenue)
                .usersByRole(usersByRole)
                .weeklyGrowth(weeklyGrowth)
                .recentActivities(recentActivities)
                .build();
    }

    private Map<String, Long> getUsersByRole() {
        List<User> allUsers = userRepository.findAll();
        return allUsers.stream()
                .flatMap(user -> user.getRoles().stream())
                .collect(Collectors.groupingBy(
                        role -> role.getName().name(),
                        Collectors.counting()
                ));
    }

    private List<AdminDashboardStats.WeeklyGrowthData> getWeeklyGrowthData() {
        List<AdminDashboardStats.WeeklyGrowthData> weeklyData = new ArrayList<>();
        LocalDate today = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");

        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

            Long newUsers = userRepository.countByCreatedAtBetween(startOfDay, endOfDay);
            Long newBookings = bookingRepository.countByCreatedAtBetween(startOfDay, endOfDay);
            Long newOrders = orderRepository.countByCreatedAtBetween(startOfDay, endOfDay);
            Double revenue = calculateRevenueBetween(startOfDay, endOfDay);

            weeklyData.add(AdminDashboardStats.WeeklyGrowthData.builder()
                    .date(date.format(formatter))
                    .newUsers(newUsers)
                    .newBookings(newBookings)
                    .newOrders(newOrders)
                    .revenue(revenue)
                    .build());
        }

        return weeklyData;
    }

    private List<AdminDashboardStats.RecentActivity> getRecentActivities() {
        List<AdminDashboardStats.RecentActivity> activities = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm");

        // Get recent users (last 5)
        List<User> recentUsers = userRepository.findTop5ByOrderByCreatedAtDesc();
        for (User user : recentUsers) {
            String roleNames = user.getRoles().stream()
                    .map(role -> role.getName().name())
                    .collect(Collectors.joining(", "));
            
            activities.add(AdminDashboardStats.RecentActivity.builder()
                    .activityType("USER_REGISTRATION")
                    .description("New user registered: " + user.getUsername())
                    .timestamp(user.getCreatedAt().format(formatter))
                    .userRole(roleNames)
                    .build());
        }

        // Get recent bookings (last 5)
        List<Booking> recentBookings = bookingRepository.findTop5ByOrderByCreatedAtDesc();
        for (Booking booking : recentBookings) {
            activities.add(AdminDashboardStats.RecentActivity.builder()
                    .activityType("BOOKING")
                    .description("New booking at " + booking.getCafe().getName())
                    .timestamp(booking.getCreatedAt().format(formatter))
                    .userRole("CUSTOMER")
                    .build());
        }

        // Sort by timestamp descending and limit to 10
        return activities.stream()
                .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                .limit(10)
                .collect(Collectors.toList());
    }

    private Double calculateTotalRevenue() {
        List<Payment> completedPayments = paymentRepository.findByStatus(Payment.PaymentStatus.COMPLETED);
        return completedPayments.stream()
                .map(Payment::getAmount)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();
    }

    private Double calculateRevenueAfter(LocalDateTime after) {
        List<Payment> payments = paymentRepository.findByStatusAndCreatedAtAfter(
                Payment.PaymentStatus.COMPLETED, after);
        return payments.stream()
                .map(Payment::getAmount)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();
    }

    private Double calculateRevenueBetween(LocalDateTime start, LocalDateTime end) {
        List<Payment> payments = paymentRepository.findByStatusAndCreatedAtBetween(
                Payment.PaymentStatus.COMPLETED, start, end);
        return payments.stream()
                .map(Payment::getAmount)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();
    }
}
