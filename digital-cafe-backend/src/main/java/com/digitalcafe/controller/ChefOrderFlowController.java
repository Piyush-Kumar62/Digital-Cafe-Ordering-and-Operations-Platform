package com.digitalcafe.controller;

import com.digitalcafe.dto.request.OrderStatusUpdateRequest;
import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.OrderResponse;
import com.digitalcafe.entity.Order;
import com.digitalcafe.entity.User;
import com.digitalcafe.repository.UserRepository;
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
    private final UserRepository userRepository;

    @GetMapping("/orders")
    @PreAuthorize("hasRole('CHEF')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getKitchenOrders() {
        Long cafeId = getCafeIdFromAuthentication(SecurityContextHolder.getContext().getAuthentication());
        List<OrderResponse> queue = new ArrayList<>();
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
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));
        if (user.getCafe() == null) {
            throw new IllegalArgumentException("Authenticated user is not assigned to any cafe");
        }
        return user.getCafe().getId();
    }
}
