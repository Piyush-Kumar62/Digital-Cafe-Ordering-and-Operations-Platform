package com.digitalcafe.service;

import com.digitalcafe.dto.response.OwnerDashboardAnalyticsResponse;
import com.digitalcafe.entity.Order;
import com.digitalcafe.entity.Payment;
import com.digitalcafe.repository.BookingRepository;
import com.digitalcafe.repository.CafeTableRepository;
import com.digitalcafe.repository.OrderRepository;
import com.digitalcafe.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OwnerDashboardAnalyticsService {

    private final BookingRepository bookingRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final CafeTableRepository cafeTableRepository;

    public OwnerDashboardAnalyticsResponse getOwnerDashboard(Long cafeId) {
        long totalBookings = bookingRepository.countByCafeId(cafeId);
        long totalOrders = orderRepository.countByCafeId(cafeId);
        BigDecimal revenue = paymentRepository.sumAmountByCafeAndStatusIn(
                cafeId,
            EnumSet.of(Payment.PaymentStatus.CAPTURED, Payment.PaymentStatus.COMPLETED, Payment.PaymentStatus.SUCCESS)
        );
        Long activeTables = cafeTableRepository.countByCafeIdAndIsAvailable(cafeId, true);

        Map<String, Long> ordersByStatus = new LinkedHashMap<>();
        for (Order.OrderStatus status : Order.OrderStatus.values()) {
            ordersByStatus.put(status.name(), orderRepository.countByCafeIdAndStatus(cafeId, status));
        }

        return OwnerDashboardAnalyticsResponse.builder()
                .totalBookings(totalBookings)
                .totalOrders(totalOrders)
                .revenue(revenue == null ? BigDecimal.ZERO : revenue)
                .ordersByStatus(ordersByStatus)
                .activeTables(activeTables == null ? 0L : activeTables)
                .build();
    }
}
