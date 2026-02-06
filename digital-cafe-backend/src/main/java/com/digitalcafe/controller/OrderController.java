package com.digitalcafe.controller;

import com.digitalcafe.dto.OrderDTO;
import com.digitalcafe.dto.OrderRequestDTO;
import com.digitalcafe.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<List<OrderDTO>> getAllOrders() {
        List<OrderDTO> orders = orderService.getAllOrders();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDTO> getOrderById(@PathVariable Long id) {
        OrderDTO order = orderService.getOrderById(id);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<OrderDTO>> getOrdersByCustomer(@PathVariable Long customerId) {
        List<OrderDTO> orders = orderService.getOrdersByCustomer(customerId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/cafe/{cafeId}")
    public ResponseEntity<List<OrderDTO>> getOrdersByCafe(@PathVariable Long cafeId) {
        List<OrderDTO> orders = orderService.getOrdersByCafe(cafeId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<OrderDTO>> getOrdersByStatus(@PathVariable String status) {
        List<OrderDTO> orders = orderService.getOrdersByStatus(status);
        return ResponseEntity.ok(orders);
    }

    @PostMapping
    public ResponseEntity<OrderDTO> createOrder(@Valid @RequestBody OrderRequestDTO orderRequestDTO) {
        OrderDTO createdOrder = orderService.createOrder(orderRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdOrder);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderDTO> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusUpdate) {
        String status = statusUpdate.get("status");
        OrderDTO updatedOrder = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(updatedOrder);
    }

    @PostMapping("/{orderId}/confirm")
    public ResponseEntity<OrderDTO> confirmOrder(@PathVariable Long orderId,
                                                 @RequestBody Map<String, Long> request) {
        Long ownerId = request.get("ownerId");
        OrderDTO confirmedOrder = orderService.confirmOrder(orderId, ownerId);
        return ResponseEntity.ok(confirmedOrder);
    }

    @PostMapping("/{orderId}/start-preparing")
    public ResponseEntity<OrderDTO> startPreparing(@PathVariable Long orderId,
                                                   @RequestBody Map<String, Long> request) {
        Long chefId = request.get("chefId");
        OrderDTO order = orderService.startPreparing(orderId, chefId);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/{orderId}/mark-ready")
    public ResponseEntity<OrderDTO> markReady(@PathVariable Long orderId,
                                              @RequestBody Map<String, Long> request) {
        Long chefId = request.get("chefId");
        OrderDTO order = orderService.markReady(orderId, chefId);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/{orderId}/mark-served")
    public ResponseEntity<OrderDTO> markServed(@PathVariable Long orderId,
                                               @RequestBody Map<String, Long> request) {
        Long waiterId = request.get("waiterId");
        OrderDTO order = orderService.markServed(orderId, waiterId);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/{orderId}/complete")
    public ResponseEntity<OrderDTO> completeOrder(@PathVariable Long orderId) {
        OrderDTO order = orderService.completeOrder(orderId);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<OrderDTO> cancelOrder(@PathVariable Long orderId,
                                               @RequestBody Map<String, String> request) {
        String reason = request.getOrDefault("reason", "Cancelled by user");
        OrderDTO order = orderService.cancelOrder(orderId, reason);
        return ResponseEntity.ok(order);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }
}
