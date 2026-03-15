package com.digitalcafe.service;

import com.digitalcafe.dto.response.AdminDashboardStats;
import com.digitalcafe.dto.response.AdminDashboardAnalyticsResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.entity.*;
import com.digitalcafe.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
                .totalRevenue(totalRevenue)
                .todayRevenue(todayRevenue)
                .thisMonthRevenue(thisMonthRevenue)
                .usersByRole(usersByRole)
                .weeklyGrowth(weeklyGrowth)
                .recentActivities(recentActivities)
                .build();
    }

    public AdminDashboardAnalyticsResponse getDashboardAnalytics() {
        AdminDashboardStats stats = getDashboardStats();
        List<AdminDashboardAnalyticsResponse.WeeklyGrowthPoint> weeklyGrowth =
                Optional.ofNullable(stats.getWeeklyGrowth())
                        .orElseGet(List::of)
                        .stream()
                        .map(point -> AdminDashboardAnalyticsResponse.WeeklyGrowthPoint.builder()
                                .date(point.getDate())
                                .newUsers(point.getNewUsers() == null ? 0L : point.getNewUsers())
                                .newBookings(point.getNewBookings() == null ? 0L : point.getNewBookings())
                                .newOrders(point.getNewOrders() == null ? 0L : point.getNewOrders())
                                .revenue(point.getRevenue() == null ? 0.0 : point.getRevenue())
                                .build())
                        .toList();

        List<AdminDashboardAnalyticsResponse.WeeklyRegistrationPoint> weeklyRegistrationGrowth =
                Optional.ofNullable(stats.getWeeklyGrowth())
                        .orElseGet(List::of)
                        .stream()
                        .map(point -> AdminDashboardAnalyticsResponse.WeeklyRegistrationPoint.builder()
                                .date(point.getDate())
                                .count(point.getNewUsers() == null ? 0L : point.getNewUsers())
                                .build())
                        .toList();

        List<AdminDashboardAnalyticsResponse.RecentActivityPoint> recentActivities =
                Optional.ofNullable(stats.getRecentActivities())
                        .orElseGet(List::of)
                        .stream()
                        .map(activity -> AdminDashboardAnalyticsResponse.RecentActivityPoint.builder()
                                .activityType(activity.getActivityType())
                                .description(activity.getDescription())
                                .timestamp(activity.getTimestamp())
                                .userRole(activity.getUserRole())
                                .build())
                        .toList();

        return AdminDashboardAnalyticsResponse.builder()
                .totalUsers(stats.getTotalUsers())
                .activeUsers(stats.getActiveUsers())
                .inactiveUsers(stats.getInactiveUsers())
                .unverifiedEmailUsers(stats.getUnverifiedEmailUsers())
                .usersWithoutPasswordReset(stats.getUsersWithoutPasswordReset())
                .todayNewRegistrations(stats.getTodayNewRegistrations())
                .usersByRole(stats.getUsersByRole())
                .weeklyGrowth(weeklyGrowth)
                .weeklyRegistrationGrowth(weeklyRegistrationGrowth)
                .recentActivities(recentActivities)
                .totalCafes(stats.getTotalCafes())
                .activeCafes(stats.getActiveCafes())
                .inactiveCafes(stats.getInactiveCafes())
                .totalBookings(stats.getTotalBookings())
                .todayBookings(stats.getTodayBookings())
                .pendingBookings(stats.getPendingBookings())
                .confirmedBookings(stats.getConfirmedBookings())
                .totalOrders(stats.getTotalOrders())
                .todayOrders(stats.getTodayOrders())
                .pendingOrders(stats.getPendingOrders())
                .revenueSummary(AdminDashboardAnalyticsResponse.RevenueSummary.builder()
                        .totalRevenue(stats.getTotalRevenue())
                        .todayRevenue(stats.getTodayRevenue())
                        .thisMonthRevenue(stats.getThisMonthRevenue())
                        .build())
                .totalRevenue(stats.getTotalRevenue())
                .todayRevenue(stats.getTodayRevenue())
                .thisMonthRevenue(stats.getThisMonthRevenue())
                .build();
    }

    public PageResponse<AdminDashboardAnalyticsResponse.RecentActivityPoint> getActivities(Pageable pageable) {
        int pageNumber = Math.max(0, pageable.getPageNumber());
        int pageSize = Math.max(1, pageable.getPageSize());
        int needed = (pageNumber + 1) * pageSize;
        Pageable fetchPage = PageRequest.of(0, needed, Sort.by(Sort.Direction.DESC, "createdAt"));

        List<AdminDashboardAnalyticsResponse.RecentActivityPoint> allActivities = new ArrayList<>();

        userRepository.findAllByOrderByCreatedAtDesc(fetchPage).forEach(user -> {
            String roleNames = user.getRoles().stream()
                    .map(role -> role.getName().name())
                    .collect(Collectors.joining(", "));
            allActivities.add(AdminDashboardAnalyticsResponse.RecentActivityPoint.builder()
                    .activityType("USER_REGISTRATION")
                    .description("New user registered: " + user.getUsername())
                    .timestamp(user.getCreatedAt().toString())
                    .userRole(roleNames)
                    .build());
        });

        bookingRepository.findAllByOrderByCreatedAtDesc(fetchPage).forEach(booking ->
                allActivities.add(AdminDashboardAnalyticsResponse.RecentActivityPoint.builder()
                        .activityType("BOOKING")
                        .description("New booking at " + booking.getCafe().getName())
                        .timestamp(booking.getCreatedAt().toString())
                        .userRole("CUSTOMER")
                        .build())
        );

        orderRepository.findAllByOrderByCreatedAtDesc(fetchPage).forEach(order ->
                allActivities.add(AdminDashboardAnalyticsResponse.RecentActivityPoint.builder()
                        .activityType("ORDER")
                        .description("Order placed: " + order.getOrderNumber())
                        .timestamp(order.getCreatedAt().toString())
                        .userRole("CUSTOMER")
                        .build())
        );

        paymentRepository.findAllByOrderByCreatedAtDesc(fetchPage).forEach(payment ->
                allActivities.add(AdminDashboardAnalyticsResponse.RecentActivityPoint.builder()
                        .activityType("PAYMENT")
                        .description("Payment " + payment.getStatus().name() + " for order " + payment.getOrder().getOrderNumber())
                        .timestamp(payment.getCreatedAt().toString())
                        .userRole("CUSTOMER")
                        .build())
        );

        allActivities.sort(Comparator.comparing(
                (AdminDashboardAnalyticsResponse.RecentActivityPoint a) -> LocalDateTime.parse(a.getTimestamp()))
                .reversed());

        int fromIndex = Math.min(pageNumber * pageSize, allActivities.size());
        int toIndex = Math.min(fromIndex + pageSize, allActivities.size());
        List<AdminDashboardAnalyticsResponse.RecentActivityPoint> content = allActivities.subList(fromIndex, toIndex);

        long totalElements = userRepository.count() + bookingRepository.count() + orderRepository.count() + paymentRepository.count();
        int totalPages = (int) Math.ceil(totalElements / (double) pageSize);

        return PageResponse.<AdminDashboardAnalyticsResponse.RecentActivityPoint>builder()
                .content(content)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .isFirst(pageNumber == 0)
                .isLast(pageNumber >= Math.max(totalPages - 1, 0))
                .hasNext(pageNumber < totalPages - 1)
                .hasPrevious(pageNumber > 0)
                .build();
    }

    private Map<String, Long> getUsersByRole() {
        List<User> allUsers = userRepository.findAll();
        Map<String, Long> counts = new LinkedHashMap<>();
        for (Role.RoleName roleName : Role.RoleName.values()) {
            counts.put(roleName.name(), 0L);
        }

        Map<String, Long> grouped = allUsers.stream()
                .flatMap(user -> user.getRoles().stream())
                .collect(Collectors.groupingBy(
                        role -> role.getName().name(),
                        Collectors.counting()
                ));

        grouped.forEach(counts::put);
        return counts;
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

        // Get recent users (last 5)
        List<User> recentUsers = userRepository.findTop5ByOrderByCreatedAtDesc();
        for (User user : recentUsers) {
            String roleNames = user.getRoles().stream()
                    .map(role -> role.getName().name())
                    .collect(Collectors.joining(", "));
            
            activities.add(AdminDashboardStats.RecentActivity.builder()
                    .activityType("USER_REGISTRATION")
                    .description("New user registered: " + user.getUsername())
                    .timestamp(user.getCreatedAt().toString())
                    .userRole(roleNames)
                    .build());
        }

        // Get recent bookings (last 5)
        List<Booking> recentBookings = bookingRepository.findTop5ByOrderByCreatedAtDesc();
        for (Booking booking : recentBookings) {
            activities.add(AdminDashboardStats.RecentActivity.builder()
                    .activityType("BOOKING")
                    .description("New booking at " + booking.getCafe().getName())
                    .timestamp(booking.getCreatedAt().toString())
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
        List<Payment> completedPayments = paymentRepository.findByStatusIn(revenueStatuses());
        return completedPayments.stream()
                .map(Payment::getAmount)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();
    }

    private Double calculateRevenueAfter(LocalDateTime after) {
        List<Payment> payments = paymentRepository.findByStatusInAndCreatedAtAfter(revenueStatuses(), after);
        return payments.stream()
                .map(Payment::getAmount)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();
    }

    private Double calculateRevenueBetween(LocalDateTime start, LocalDateTime end) {
        List<Payment> payments = paymentRepository.findByStatusInAndCreatedAtBetween(revenueStatuses(), start, end);
        return payments.stream()
                .map(Payment::getAmount)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();
    }

    private Collection<Payment.PaymentStatus> revenueStatuses() {
        return EnumSet.of(Payment.PaymentStatus.CAPTURED, Payment.PaymentStatus.COMPLETED);
    }
}
