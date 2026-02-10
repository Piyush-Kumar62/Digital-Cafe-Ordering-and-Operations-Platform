package com.digitalcafe.service.impl;

import com.digitalcafe.dto.request.OrderRequest;
import com.digitalcafe.dto.request.OrderStatusUpdateRequest;
import com.digitalcafe.dto.response.OrderResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.entity.*;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.mapper.OrderMapper;
import com.digitalcafe.repository.*;
import com.digitalcafe.service.OrderService;
import com.digitalcafe.websocket.OrderNotification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final BookingRepository bookingRepository;
    private final MenuItemRepository menuItemRepository;
    private final UserRepository userRepository;
    private final OrderMapper orderMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public OrderResponse createOrder(Long customerId, OrderRequest request) {
        log.info("Creating order for customer: {}, booking: {}", customerId, request.getBookingId());

        // Validate booking
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (!booking.getCustomer().getId().equals(customerId)) {
            throw new IllegalArgumentException("Booking does not belong to this customer");
        }

        if (booking.getStatus() != Booking.BookingStatus.CONFIRMED) {
            throw new IllegalArgumentException("Booking must be confirmed to place an order");
        }

        // Check if order already exists for this booking
        if (orderRepository.existsByBookingId(booking.getId())) {
            throw new IllegalArgumentException("An order already exists for this booking");
        }

        // Create order
        Order order = new Order();
        order.setOrderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.setBooking(booking);
        order.setCustomer(booking.getCustomer());
        order.setCafe(booking.getCafe());
        order.setStatus(Order.OrderStatus.PLACED);
        order.setSpecialInstructions(request.getSpecialInstructions());

        // Create order items
        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (OrderRequest.OrderItemRequest itemRequest : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemRequest.getMenuItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Menu item not found: " + itemRequest.getMenuItemId()));

            if (!menuItem.getCafe().getId().equals(booking.getCafe().getId())) {
                throw new IllegalArgumentException("Menu item does not belong to the booking's cafe");
            }

            if (!menuItem.getIsAvailable()) {
                throw new IllegalArgumentException("Menu item is not available: " + menuItem.getName());
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setMenuItem(menuItem);
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setUnitPrice(menuItem.getPrice());
            orderItem.setTotalPrice(menuItem.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity())));
            orderItem.setSpecialInstructions(itemRequest.getSpecialInstructions());

            orderItems.add(orderItem);
            subtotal = subtotal.add(orderItem.getTotalPrice());
        }

        order.setOrderItems(orderItems);
        order.setSubtotal(subtotal);

        // Calculate tax (assuming 10%)
        BigDecimal tax = subtotal.multiply(BigDecimal.valueOf(0.10));
        order.setTax(tax);

        // Calculate discount if any
        order.setDiscount(BigDecimal.ZERO);

        // Calculate total
        BigDecimal total = subtotal.add(tax).subtract(order.getDiscount());
        order.setTotalAmount(total);

        order = orderRepository.save(order);
        log.info("Order created successfully: {}", order.getOrderNumber());

        // Send WebSocket notification to chef
        sendOrderNotification(order, "ORDER_PLACED", "/topic/chef/" + booking.getCafe().getId());

        return orderMapper.toResponse(order);
    }

    @Override
    public OrderResponse getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        return orderMapper.toResponse(order);
    }

    @Override
    public List<OrderResponse> getOrdersByCustomerId(Long customerId) {
        List<Order> orders = orderRepository.findByCustomerId(customerId);
        return orderMapper.toResponseList(orders);
    }

    @Override
    public PageResponse<OrderResponse> getOrdersByCafeId(Long cafeId, Pageable pageable) {
        Page<Order> page = orderRepository.findByCafeId(cafeId, pageable);
        return PageResponse.<OrderResponse>builder()
                .content(orderMapper.toResponseList(page.getContent()))
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    @Override
    public List<OrderResponse> getOrdersByStatus(Long cafeId, Order.OrderStatus status) {
        List<Order> orders = orderRepository.findByCafeIdAndStatus(cafeId, status);
        return orderMapper.toResponseList(orders);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatusUpdateRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        Order.OrderStatus newStatus = Order.OrderStatus.valueOf(request.getStatus());
        Order.OrderStatus oldStatus = order.getStatus();

        // Validate status transition
        validateStatusTransition(oldStatus, newStatus);

        order.setStatus(newStatus);

        // Update timestamps and assign staff based on status
        switch (newStatus) {
            case PREPARING:
                if (order.getPreparingAt() == null) {
                    order.setPreparingAt(LocalDateTime.now());
                }
                if (request.getStaffId() != null) {
                    User chef = userRepository.findById(request.getStaffId())
                            .orElseThrow(() -> new ResourceNotFoundException("Chef not found"));
                    order.setPreparingByChef(chef);
                }
                sendOrderNotification(order, "ORDER_PREPARING", "/topic/customer/" + order.getCustomer().getId());
                break;

            case READY:
                if (order.getReadyAt() == null) {
                    order.setReadyAt(LocalDateTime.now());
                }
                sendOrderNotification(order, "ORDER_READY", "/topic/waiter/" + order.getCafe().getId());
                sendOrderNotification(order, "ORDER_READY", "/topic/customer/" + order.getCustomer().getId());
                break;

            case SERVED:
                if (order.getServedAt() == null) {
                    order.setServedAt(LocalDateTime.now());
                }
                if (request.getStaffId() != null) {
                    User waiter = userRepository.findById(request.getStaffId())
                            .orElseThrow(() -> new ResourceNotFoundException("Waiter not found"));
                    order.setServedByWaiter(waiter);
                }
                sendOrderNotification(order, "ORDER_SERVED", "/topic/customer/" + order.getCustomer().getId());
                break;

            case CANCELLED:
                order.setCancelledAt(LocalDateTime.now());
                order.setCancellationReason(request.getReason());
                sendOrderNotification(order, "ORDER_CANCELLED", "/topic/customer/" + order.getCustomer().getId());
                break;
        }

        order = orderRepository.save(order);
        log.info("Order {} status updated from {} to {}", order.getOrderNumber(), oldStatus, newStatus);

        return orderMapper.toResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() == Order.OrderStatus.SERVED || order.getStatus() == Order.OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot cancel order with status: " + order.getStatus());
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());
        order = orderRepository.save(order);

        sendOrderNotification(order, "ORDER_CANCELLED", "/topic/customer/" + order.getCustomer().getId());
        sendOrderNotification(order, "ORDER_CANCELLED", "/topic/chef/" + order.getCafe().getId());

        return orderMapper.toResponse(order);
    }

    @Override
    public List<OrderResponse> getPendingOrdersForChef(Long cafeId) {
        List<Order> orders = orderRepository.findPendingOrdersForChef(cafeId);
        return orderMapper.toResponseList(orders);
    }

    @Override
    public List<OrderResponse> getReadyOrdersForWaiter(Long cafeId) {
        List<Order> orders = orderRepository.findReadyOrdersForWaiter(cafeId);
        return orderMapper.toResponseList(orders);
    }

    private void validateStatusTransition(Order.OrderStatus from, Order.OrderStatus to) {
        // Define valid transitions
        boolean isValid = false;
        switch (from) {
            case PLACED:
                isValid = to == Order.OrderStatus.PREPARING || to == Order.OrderStatus.CANCELLED;
                break;
            case PREPARING:
                isValid = to == Order.OrderStatus.READY || to == Order.OrderStatus.CANCELLED;
                break;
            case READY:
                isValid = to == Order.OrderStatus.SERVED || to == Order.OrderStatus.CANCELLED;
                break;
            case SERVED:
            case CANCELLED:
                isValid = false; // Terminal states
                break;
        }

        if (!isValid) {
            throw new IllegalArgumentException("Invalid status transition from " + from + " to " + to);
        }
    }

    private void sendOrderNotification(Order order, String notificationType, String destination) {
        OrderNotification notification = OrderNotification.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .cafeId(order.getCafe().getId())
                .cafeName(order.getCafe().getName())
                .status(order.getStatus().name())
                .type(OrderNotification.NotificationType.valueOf(notificationType))
                .message("Order " + order.getOrderNumber() + " is now " + order.getStatus())
                .timestamp(LocalDateTime.now())
                .build();

        messagingTemplate.convertAndSend(destination, notification);
        log.debug("Sent notification to {}: {}", destination, notificationType);
    }
}
