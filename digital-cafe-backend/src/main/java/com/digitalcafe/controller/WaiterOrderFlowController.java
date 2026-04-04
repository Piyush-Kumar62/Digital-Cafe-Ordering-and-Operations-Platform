package com.digitalcafe.controller;

import com.digitalcafe.dto.WaiterDashboardDTO;
import com.digitalcafe.dto.request.OrderStatusUpdateRequest;
import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.CafeResponse;
import com.digitalcafe.dto.response.OrderResponse;
import com.digitalcafe.entity.Order;
import com.digitalcafe.exception.BusinessException;
import com.digitalcafe.service.CafeService;
import com.digitalcafe.service.OrderService;
import com.digitalcafe.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/waiter")
@RequiredArgsConstructor
public class WaiterOrderFlowController {

    private final OrderService orderService;
    private final CafeService cafeService;
    private final UserService userService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('WAITER')")
    public ResponseEntity<ApiResponse<WaiterDashboardDTO>> getWaiterDashboard() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long cafeId = getCafeIdFromAuthentication(auth);
        CafeResponse cafe = cafeService.getCafeById(cafeId);
        WaiterDashboardDTO dashboard = orderService.getWaiterDashboard(cafeId, cafe.getName());
        return ResponseEntity.ok(ApiResponse.success("Waiter dashboard retrieved successfully", dashboard));
    }

    @GetMapping("/ready-orders")
    @PreAuthorize("hasRole('WAITER')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getReadyOrders() {
        Long cafeId = getCafeIdFromAuthentication(SecurityContextHolder.getContext().getAuthentication());
        List<OrderResponse> response = orderService.getOrdersByStatus(cafeId, Order.OrderStatus.READY);
        return ResponseEntity.ok(ApiResponse.success("Ready orders retrieved successfully", response));
    }

    @PutMapping("/order/{orderId}/served")
    @PreAuthorize("hasRole('WAITER')")
    public ResponseEntity<ApiResponse<OrderResponse>> markServed(@PathVariable Long orderId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long cafeId = getCafeIdFromAuthentication(auth);

        Order order = orderService.getOrderEntity(orderId);
        if (order.getCafe() == null || !cafeId.equals(order.getCafe().getId())) {
            throw new BusinessException("Order does not belong to your cafe.");
        }
        if (order.getBooking() == null || order.getBooking().getTable() == null) {
            throw new BusinessException("Order is not linked to a booked table.");
        }

        OrderStatusUpdateRequest request = OrderStatusUpdateRequest.builder()
                .status(Order.OrderStatus.SERVED.name())
                .staffId(userService.getCurrentUserId())
                .build();
        OrderResponse response = orderService.updateOrderStatus(orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Order marked as SERVED", response));
    }

    private Long getCafeIdFromAuthentication(Authentication authentication) {
        return cafeService.getCafeIdForUser(authentication.getName());
    }
}
