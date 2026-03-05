package com.digitalcafe.controller;

import com.digitalcafe.dto.request.OrderStatusUpdateRequest;
import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.OrderResponse;
import com.digitalcafe.entity.Order;
import com.digitalcafe.service.CafeService;
import com.digitalcafe.service.OrderService;
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
        OrderStatusUpdateRequest request = OrderStatusUpdateRequest.builder()
                .status(Order.OrderStatus.SERVED.name())
                .build();
        OrderResponse response = orderService.updateOrderStatus(orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Order marked as SERVED", response));
    }

    @PutMapping("/orders/{orderId}/serve")
    @PreAuthorize("hasRole('WAITER')")
    public ResponseEntity<ApiResponse<OrderResponse>> serveOrder(@PathVariable Long orderId) {
        return markServed(orderId);
    }

    private Long getCafeIdFromAuthentication(Authentication authentication) {
        return cafeService.getCafeIdForUser(authentication.getName());
    }
}
