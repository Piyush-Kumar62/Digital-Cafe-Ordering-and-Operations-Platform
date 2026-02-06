package com.digitalcafe.service;

import com.digitalcafe.dto.*;
import com.digitalcafe.model.Order;
import com.digitalcafe.model.User;
import com.digitalcafe.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CafeRepository cafeRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TableBookingRepository bookingRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private CafeTableRepository cafeTableRepository;

    public AdminDashboardDTO getAdminDashboard() {
        AdminDashboardDTO dashboard = new AdminDashboardDTO();

        // Total users
        dashboard.setTotalUsers(userRepository.count());

        // Active/Inactive users
        dashboard.setActiveUsers(userRepository.countByActive(true));
        dashboard.setInactiveUsers(userRepository.countByActive(false));

        // Unverified emails
        dashboard.setUnverifiedEmails(userRepository.countByEmailVerified(false));

        // Incomplete profiles
        dashboard.setIncompleteProfiles(userRepository.countByProfileCompleted(false));

        // Total cafes
        dashboard.setTotalCafes(cafeRepository.count());

        // Today's registrations
        LocalDateTime today = LocalDate.now().atStartOfDay();
        dashboard.setTodayRegistrations(userRepository.countByCreatedAtAfter(today));

        // Weekly growth (last 7 days)
        List<Integer> weeklyGrowth = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDateTime startOfDay = LocalDate.now().minusDays(i).atStartOfDay();
            LocalDateTime endOfDay = startOfDay.plusDays(1);
            Long count = userRepository.countByCreatedAtBetween(startOfDay, endOfDay);
            weeklyGrowth.add(count.intValue());
        }
        dashboard.setWeeklyGrowth(weeklyGrowth);

        // Users by role
        Map<String, Long> usersByRole = new HashMap<>();
        for (User.Role role : User.Role.values()) {
            usersByRole.put(role.toString(), userRepository.countByRole(role));
        }
        dashboard.setUsersByRole(usersByRole);

        // Recent users (last 10)
        List<User> recentUsers = userRepository.findTop10ByOrderByCreatedAtDesc();
        dashboard.setRecentUsers(recentUsers.stream()
                .map(this::convertToRecentUserDTO)
                .collect(Collectors.toList()));

        return dashboard;
    }

    public OwnerDashboardDTO getOwnerDashboard(Long userId) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get owner's cafe
        Long cafeId = cafeRepository.findByOwner(owner).stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Cafe not found"))
                .getId();

        OwnerDashboardDTO dashboard = new OwnerDashboardDTO();

        // Total tables
        dashboard.setTotalTables(cafeTableRepository.countByCafeId(cafeId));

        // Total menu items
        dashboard.setTotalMenuItems(menuItemRepository.countByCafeId(cafeId));

        // Today's bookings
        LocalDate today = LocalDate.now();
        dashboard.setTodayBookings(bookingRepository.countByCafeIdAndBookingDate(cafeId, today));

        // Today's orders
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        dashboard.setTodayOrders(orderRepository.countByCafeIdAndCreatedAtBetween(cafeId, startOfDay, endOfDay));

        // Today's revenue
        List<Order> todayOrders = orderRepository.findByCafeIdAndCreatedAtBetween(cafeId, startOfDay, endOfDay);
        BigDecimal todayRevenue = todayOrders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dashboard.setTodayRevenue(todayRevenue);

        // Monthly revenue
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        List<Order> monthlyOrders = orderRepository.findByCafeIdAndCreatedAtAfter(cafeId, startOfMonth);
        BigDecimal monthlyRevenue = monthlyOrders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dashboard.setMonthlyRevenue(monthlyRevenue);

        // Total chefs and waiters
        dashboard.setTotalChefs(userRepository.countByRoleAndCreatedBy(User.Role.CHEF, owner));
        dashboard.setTotalWaiters(userRepository.countByRoleAndCreatedBy(User.Role.WAITER, owner));

        // Popular items (top 5)
        dashboard.setPopularItems(getPopularItems(cafeId));

        // Revenue chart data (last 7 days)
        dashboard.setRevenueChart(getRevenueChartData(cafeId));

        return dashboard;
    }

    public ChefDashboardDTO getChefDashboard(Long cafeId) {
        ChefDashboardDTO dashboard = new ChefDashboardDTO();

        // Pending orders (PLACED, CONFIRMED)
        dashboard.setPendingOrders(orderRepository.countByCafeIdAndStatusIn(cafeId, 
                Arrays.asList(Order.OrderStatus.PLACED, Order.OrderStatus.CONFIRMED)));

        // Preparing orders
        dashboard.setPreparingOrders(orderRepository.countByCafeIdAndStatus(cafeId, Order.OrderStatus.PREPARING));

        // Completed today
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        dashboard.setCompletedTodayOrders(orderRepository.countByCafeIdAndStatusAndCreatedAtBetween(
                cafeId, Order.OrderStatus.READY, startOfDay, endOfDay));

        // Average preparation time (placeholder - would need tracking)
        dashboard.setAveragePreparationTime(15.0);

        // Order queue
        List<Order> queueOrders = orderRepository.findByCafeIdAndStatusInOrderByCreatedAtAsc(cafeId,
                Arrays.asList(Order.OrderStatus.PLACED, Order.OrderStatus.CONFIRMED, Order.OrderStatus.PREPARING));
        dashboard.setOrderQueue(queueOrders.stream()
                .map(this::convertToOrderSummaryDTO)
                .collect(Collectors.toList()));

        return dashboard;
    }

    public WaiterDashboardDTO getWaiterDashboard(Long cafeId) {
        WaiterDashboardDTO dashboard = new WaiterDashboardDTO();

        // Ready orders
        dashboard.setReadyOrders(orderRepository.countByCafeIdAndStatus(cafeId, Order.OrderStatus.READY));

        // Active bookings (today's confirmed bookings)
        LocalDate today = LocalDate.now();
        dashboard.setActiveBookings(bookingRepository.countByCafeIdAndBookingDateAndStatus(
                cafeId, today, com.digitalcafe.model.TableBooking.BookingStatus.CONFIRMED));

        // Served today
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        dashboard.setServedTodayOrders(orderRepository.countByCafeIdAndStatusAndCreatedAtBetween(
                cafeId, Order.OrderStatus.SERVED, startOfDay, endOfDay));

        // Service queue
        List<Order> serviceOrders = orderRepository.findByCafeIdAndStatusOrderByCreatedAtAsc(
                cafeId, Order.OrderStatus.READY);
        dashboard.setServiceQueue(serviceOrders.stream()
                .map(this::convertToOrderSummaryDTO)
                .collect(Collectors.toList()));

        return dashboard;
    }

    private List<PopularItemDTO> getPopularItems(Long cafeId) {
        // This would require a more complex query in a real application
        // For now, returning empty list
        return new ArrayList<>();
    }

    private List<RevenueDataDTO> getRevenueChartData(Long cafeId) {
        List<RevenueDataDTO> revenueData = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");

        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = startOfDay.plusDays(1);

            List<Order> dayOrders = orderRepository.findByCafeIdAndCreatedAtBetween(cafeId, startOfDay, endOfDay);
            BigDecimal dayRevenue = dayOrders.stream()
                    .map(Order::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            revenueData.add(new RevenueDataDTO(date.format(formatter), dayRevenue));
        }

        return revenueData;
    }

    private RecentUserDTO convertToRecentUserDTO(User user) {
        RecentUserDTO dto = new RecentUserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole().toString());
        dto.setEmailVerified(user.getEmailVerified());
        dto.setProfileCompleted(user.getProfileCompleted());
        dto.setCreatedAt(user.getCreatedAt().toString());
        return dto;
    }

    private OrderSummaryDTO convertToOrderSummaryDTO(Order order) {
        OrderSummaryDTO dto = new OrderSummaryDTO();
        dto.setId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setCustomerName(order.getCustomer().getUsername());
        dto.setStatus(order.getStatus().toString());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setTableNumber(order.getBooking() != null && order.getBooking().getTable() != null 
                ? order.getBooking().getTable().getTableNumber() : "N/A");
        dto.setCreatedAt(order.getCreatedAt().toString());
        return dto;
    }
}
