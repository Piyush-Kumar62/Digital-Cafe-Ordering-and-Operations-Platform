package com.digitalcafe.service;

import com.digitalcafe.dto.request.OrderRequest;
import com.digitalcafe.dto.request.OrderStatusUpdateRequest;
import com.digitalcafe.dto.response.OrderResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.entity.Order;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Service interface for order management operations.
 */
public interface OrderService {

    /**
     * Create a new order
     */
    OrderResponse createOrder(Long customerId, OrderRequest request);

    /**
     * Get order by ID
     */
    OrderResponse getOrderById(Long orderId);

    /**
     * Get order by booking for a specific customer
     */
    OrderResponse getOrderByBookingForCustomer(Long customerId, Long bookingId);

    /**
     * Get all orders for a customer
     */
    List<OrderResponse> getOrdersByCustomerId(Long customerId);

    /**
     * Get all orders in system
     */
    List<OrderResponse> getAllOrders();

    /**
     * Get all orders for a cafe
     */
    PageResponse<OrderResponse> getOrdersByCafeId(Long cafeId, Pageable pageable);

    /**
     * Get orders by status
     */
    List<OrderResponse> getOrdersByStatus(Long cafeId, Order.OrderStatus status);

    /**
     * Update order status (for Chef and Waiter)
     */
    OrderResponse updateOrderStatus(Long orderId, OrderStatusUpdateRequest request);

    /**
     * Cancel an order
     */
    OrderResponse cancelOrder(Long orderId);

    /**
     * Get pending orders for chef
     */
    List<OrderResponse> getPendingOrdersForChef(Long cafeId);

    /**
     * Get ready orders for waiter
     */
    List<OrderResponse> getReadyOrdersForWaiter(Long cafeId);

    /**
     * Activate kitchen flow only after successful payment.
     */
    OrderResponse activateOrderAfterPayment(Long orderId);

    /**
     * Validates that an order belongs to the given customer.
     * Throws BusinessException if ownership check fails, or ResourceNotFoundException if not found.
     */
    void validateOrderOwnership(Long orderId, Long customerId);

    /**
     * Get the raw Order entity by ID (for internal service-to-service use).
     */
    Order getOrderEntity(Long orderId);
}
