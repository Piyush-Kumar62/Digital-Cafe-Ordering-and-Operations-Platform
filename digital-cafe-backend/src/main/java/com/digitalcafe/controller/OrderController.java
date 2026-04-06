package com.digitalcafe.controller;

import com.digitalcafe.dto.request.OrderRequest;
import com.digitalcafe.dto.request.OrderStatusUpdateRequest;
import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.OrderResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.entity.Order;
import com.digitalcafe.exception.BadRequestException;
import com.digitalcafe.service.CafeService;
import com.digitalcafe.service.OrderService;
import com.digitalcafe.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;
    private final CafeService cafeService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrders() {
        List<OrderResponse> orders = orderService.getAllOrders();
        return ResponseEntity.ok(ApiResponse.success("All orders retrieved successfully", orders));
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(@Valid @RequestBody OrderRequest request) {
        Long customerId = userService.getCurrentUserId();
        OrderResponse response = orderService.createOrder(customerId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order created successfully", response));
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER', 'CAFE_OWNER', 'CHEF', 'WAITER')")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable Long orderId) {
        OrderResponse response = orderService.getOrderById(orderId);
        return ResponseEntity.ok(ApiResponse.success("Order retrieved successfully", response));
    }

    @GetMapping("/my-orders")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders() {
        Long customerId = userService.getCurrentUserId();
        List<OrderResponse> response = orderService.getOrdersByCustomerId(customerId);
        return ResponseEntity.ok(ApiResponse.success("Orders retrieved successfully", response));
    }

    @GetMapping("/cafe/{cafeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CAFE_OWNER', 'CHEF', 'WAITER')")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getOrdersByCafeId(
            @PathVariable Long cafeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {

        Sort.Direction direction = Sort.Direction.fromString(sortDirection);
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        PageResponse<OrderResponse> response = orderService.getOrdersByCafeId(cafeId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Orders retrieved successfully", response));
    }

    @GetMapping("/cafe/{cafeId}/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CAFE_OWNER', 'CHEF', 'WAITER')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrdersByCafeIdAndStatus(
            @PathVariable Long cafeId,
            @PathVariable String status) {

        final Order.OrderStatus orderStatus;
        try {
            orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid order status: " + status);
        }

        List<OrderResponse> response = orderService.getOrdersByStatus(cafeId, orderStatus);
        return ResponseEntity.ok(ApiResponse.success("Orders retrieved successfully", response));
    }

    @GetMapping("/chef/pending")
    @PreAuthorize("hasRole('CHEF')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getPendingOrdersForChef() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long cafeId = cafeService.getCafeIdForUser(authentication.getName());
        List<OrderResponse> response = orderService.getPendingOrdersForChef(cafeId);
        return ResponseEntity.ok(ApiResponse.success("Pending orders retrieved successfully", response));
    }

    @GetMapping("/waiter/ready")
    @PreAuthorize("hasRole('WAITER')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getReadyOrdersForWaiter() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long cafeId = cafeService.getCafeIdForUser(authentication.getName());
        List<OrderResponse> response = orderService.getReadyOrdersForWaiter(cafeId);
        return ResponseEntity.ok(ApiResponse.success("Ready orders retrieved successfully", response));
    }

    @PatchMapping("/{orderId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'CHEF', 'WAITER')")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody OrderStatusUpdateRequest request) {
        OrderResponse response = orderService.updateOrderStatus(orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully", response));
    }

    @PutMapping("/{orderId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'CHEF', 'WAITER')")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatusByParam(
            @PathVariable Long orderId,
            @RequestParam String status) {
        OrderStatusUpdateRequest request = OrderStatusUpdateRequest.builder()
                .status(status)
                .build();
        OrderResponse response = orderService.updateOrderStatus(orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully", response));
    }

    @PutMapping("/{orderId}/prepare")
    @PreAuthorize("hasRole('CHEF')")
    public ResponseEntity<ApiResponse<OrderResponse>> markOrderPreparing(@PathVariable Long orderId) {
        OrderStatusUpdateRequest request = OrderStatusUpdateRequest.builder()
                .status(Order.OrderStatus.PREPARING.name())
                .build();
        OrderResponse response = orderService.updateOrderStatus(orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Order marked as PREPARING", response));
    }

    @PutMapping("/{orderId}/ready")
    @PreAuthorize("hasRole('CHEF')")
    public ResponseEntity<ApiResponse<OrderResponse>> markOrderReady(@PathVariable Long orderId) {
        OrderStatusUpdateRequest request = OrderStatusUpdateRequest.builder()
                .status(Order.OrderStatus.READY.name())
                .build();
        OrderResponse response = orderService.updateOrderStatus(orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Order marked as READY", response));
    }

    @PutMapping("/{orderId}/served")
    @PreAuthorize("hasRole('WAITER')")
    public ResponseEntity<ApiResponse<OrderResponse>> markOrderServed(@PathVariable Long orderId) {
        OrderStatusUpdateRequest request = OrderStatusUpdateRequest.builder()
                .status(Order.OrderStatus.SERVED.name())
                .build();
        OrderResponse response = orderService.updateOrderStatus(orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Order marked as SERVED", response));
    }

    @PatchMapping("/{orderId}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(@PathVariable Long orderId) {
        OrderResponse response = orderService.cancelOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success("Order cancelled successfully", response));
    }

    @DeleteMapping("/{orderId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrderByDelete(@PathVariable Long orderId) {
        OrderResponse response = orderService.cancelOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success("Order cancelled successfully", response));
    }

}
