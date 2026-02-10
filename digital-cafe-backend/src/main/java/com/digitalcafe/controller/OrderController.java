package com.digitalcafe.controller;

import com.digitalcafe.dto.request.OrderRequest;
import com.digitalcafe.dto.request.OrderStatusUpdateRequest;
import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.OrderResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.entity.Order;
import com.digitalcafe.service.OrderService;
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

/**
 * REST controller for order management operations.
 */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(@Valid @RequestBody OrderRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long customerId = getUserIdFromAuthentication(authentication);

        OrderResponse response = orderService.createOrder(customerId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order created successfully", response));
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'CAFE_OWNER', 'CHEF', 'WAITER')")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable Long orderId) {
        OrderResponse response = orderService.getOrderById(orderId);
        return ResponseEntity.ok(ApiResponse.success("Order retrieved successfully", response));
    }

    @GetMapping("/my-orders")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long customerId = getUserIdFromAuthentication(authentication);

        List<OrderResponse> response = orderService.getOrdersByCustomerId(customerId);
        return ResponseEntity.ok(ApiResponse.success("Orders retrieved successfully", response));
    }

    @GetMapping("/cafe/{cafeId}")
    @PreAuthorize("hasAnyRole('CAFE_OWNER', 'CHEF', 'WAITER')")
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

    @GetMapping("/chef/pending")
    @PreAuthorize("hasRole('CHEF')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getPendingOrdersForChef() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long cafeId = getCafeIdFromAuthentication(authentication);

        List<OrderResponse> response = orderService.getPendingOrdersForChef(cafeId);
        return ResponseEntity.ok(ApiResponse.success("Pending orders retrieved successfully", response));
    }

    @GetMapping("/waiter/ready")
    @PreAuthorize("hasRole('WAITER')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getReadyOrdersForWaiter() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long cafeId = getCafeIdFromAuthentication(authentication);

        List<OrderResponse> response = orderService.getReadyOrdersForWaiter(cafeId);
        return ResponseEntity.ok(ApiResponse.success("Ready orders retrieved successfully", response));
    }

    @PatchMapping("/{orderId}/status")
    @PreAuthorize("hasAnyRole('CHEF', 'WAITER')")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody OrderStatusUpdateRequest request) {
        OrderResponse response = orderService.updateOrderStatus(orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully", response));
    }

    @PatchMapping("/{orderId}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(@PathVariable Long orderId) {
        OrderResponse response = orderService.cancelOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success("Order cancelled successfully", response));
    }

    private Long getUserIdFromAuthentication(Authentication authentication) {
        // TODO: Extract user ID from authentication
        return 1L;
    }

    private Long getCafeIdFromAuthentication(Authentication authentication) {
        // TODO: Extract cafe ID from authentication
        return 1L;
    }
}

