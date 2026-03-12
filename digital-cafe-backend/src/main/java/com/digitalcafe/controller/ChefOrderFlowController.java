package com.digitalcafe.controller;

import com.digitalcafe.dto.ChefDashboardDTO;
import com.digitalcafe.dto.request.OrderStatusUpdateRequest;
import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.CafeResponse;
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

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/chef")
@RequiredArgsConstructor
public class ChefOrderFlowController {

    private final OrderService orderService;
    private final CafeService cafeService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('CHEF')")
    public ResponseEntity<ApiResponse<ChefDashboardDTO>> getChefDashboard() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long cafeId = getCafeIdFromAuthentication(auth);
        CafeResponse cafe = cafeService.getCafeById(cafeId);
        ChefDashboardDTO dashboard = orderService.getChefDashboard(cafeId, cafe.getName());
        return ResponseEntity.ok(ApiResponse.success("Chef dashboard retrieved successfully", dashboard));
    }

    @GetMapping("/orders")
    @PreAuthorize("hasRole('CHEF')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getChefOrders() {
        Long cafeId = getCafeIdFromAuthentication(SecurityContextHolder.getContext().getAuthentication());
        List<OrderResponse> queue = new ArrayList<>();
        // Return both PLACED (new incoming orders) and PREPARING (in-progress) orders
        queue.addAll(orderService.getOrdersByStatus(cafeId, Order.OrderStatus.PLACED));
        queue.addAll(orderService.getOrdersByStatus(cafeId, Order.OrderStatus.PREPARING));
        return ResponseEntity.ok(ApiResponse.success("Chef orders retrieved successfully", queue));
    }

    @PutMapping("/order/{orderId}/preparing")
    @PreAuthorize("hasRole('CHEF')")
    public ResponseEntity<ApiResponse<OrderResponse>> markPreparing(@PathVariable Long orderId) {
        OrderStatusUpdateRequest request = OrderStatusUpdateRequest.builder()
                .status(Order.OrderStatus.PREPARING.name())
                .build();
        OrderResponse response = orderService.updateOrderStatus(orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Order marked as PREPARING", response));
    }

    @PutMapping("/order/{orderId}/ready")
    @PreAuthorize("hasRole('CHEF')")
    public ResponseEntity<ApiResponse<OrderResponse>> markReady(@PathVariable Long orderId) {
        OrderStatusUpdateRequest request = OrderStatusUpdateRequest.builder()
                .status(Order.OrderStatus.READY.name())
                .build();
        OrderResponse response = orderService.updateOrderStatus(orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Order marked as READY", response));
    }

    @PutMapping("/orders/{orderId}/status")
    @PreAuthorize("hasRole('CHEF')")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam String status) {
        OrderStatusUpdateRequest request = OrderStatusUpdateRequest.builder()
                .status(status.toUpperCase())
                .build();
        OrderResponse response = orderService.updateOrderStatus(orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully", response));
    }

    private Long getCafeIdFromAuthentication(Authentication authentication) {
        return cafeService.getCafeIdForUser(authentication.getName());
    }
}
