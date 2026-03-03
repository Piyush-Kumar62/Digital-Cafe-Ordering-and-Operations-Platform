package com.digitalcafe.service.impl;

import com.digitalcafe.dto.request.OrderRequest;
import com.digitalcafe.dto.request.OrderStatusUpdateRequest;
import com.digitalcafe.dto.response.OrderResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.entity.*;
import com.digitalcafe.exception.BusinessException;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.mapper.OrderMapper;
import com.digitalcafe.repository.*;
import com.digitalcafe.service.NotificationService;
import com.digitalcafe.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

// Production-grade Order service with strict status transitions, mapped domain violations, and complete audit trails via OrderStatusHistory.
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private static final Map<Order.OrderStatus, Set<Order.OrderStatus>> ALLOWED_TRANSITIONS =
            Map.of(
                Order.OrderStatus.PENDING_PAYMENT, EnumSet.of(Order.OrderStatus.PLACED, Order.OrderStatus.CANCELLED),
                Order.OrderStatus.PLACED,          EnumSet.of(Order.OrderStatus.PREPARING, Order.OrderStatus.CANCELLED),
                Order.OrderStatus.PREPARING,       EnumSet.of(Order.OrderStatus.READY,     Order.OrderStatus.CANCELLED),
                Order.OrderStatus.READY,           EnumSet.of(Order.OrderStatus.SERVED,    Order.OrderStatus.CANCELLED),
                Order.OrderStatus.SERVED,          EnumSet.noneOf(Order.OrderStatus.class),
                Order.OrderStatus.CANCELLED,       EnumSet.noneOf(Order.OrderStatus.class)
            );

    private final OrderRepository orderRepository;
    private final BookingRepository bookingRepository;
    private final MenuItemRepository menuItemRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final NotificationService notificationService;
    private final OrderMapper orderMapper;


    @Override
    @Transactional
    public OrderResponse createOrder(Long customerId, OrderRequest request) {
        log.info("Order creation started: customerId={}, bookingId={}", customerId, request.getBookingId());

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + request.getBookingId()));

        validateBookingOwnership(booking, customerId);
        validateBookingIsConfirmed(booking);
        assertNoExistingOrder(booking.getId());

        Order order = buildOrder(request, booking);
        order = orderRepository.save(order);

        log.info("Order created (PENDING_PAYMENT): orderId={}, orderNumber={}, customerId={}, cafeId={}",
                order.getId(), order.getOrderNumber(), customerId, booking.getCafe().getId());
        // ⚠️ Do NOT notify chef here — order is not paid yet.
        // Chef notification fires in activateOrderAfterPayment() after payment is verified.
        return orderMapper.toResponse(order);
    }


    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId) {
        return orderMapper.toResponse(fetchOrder(orderId));
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderByBookingForCustomer(Long customerId, Long bookingId) {
        List<Order> orders = orderRepository.findByBookingId(bookingId);
        return orders.stream()
                .filter(o -> o.getCustomer().getId().equals(customerId))
                .findFirst()
                .map(orderMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No order found for bookingId=" + bookingId + " and customerId=" + customerId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByCustomerId(Long customerId) {
        return orderMapper.toResponseList(orderRepository.findByCustomerId(customerId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderMapper.toResponseList(orderRepository.findAll());
    }

    @Override
    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByStatus(Long cafeId, Order.OrderStatus status) {
        return orderMapper.toResponseList(orderRepository.findByCafeIdAndStatus(cafeId, status));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getPendingOrdersForChef(Long cafeId) {
        return orderMapper.toResponseList(orderRepository.findPendingOrdersForChef(cafeId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getReadyOrdersForWaiter(Long cafeId) {
        return orderMapper.toResponseList(orderRepository.findReadyOrdersForWaiter(cafeId));
    }


    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatusUpdateRequest request) {
        Order order = fetchOrder(orderId);
        Order.OrderStatus oldStatus = order.getStatus();
        Order.OrderStatus newStatus = parseStatus(request.getStatus());

        validateTransition(oldStatus, newStatus);
        applyStatusTimestamps(order, newStatus, request);
        order = orderRepository.save(order);

        persistStatusHistory(order, oldStatus, newStatus, request.getStaffId(), request.getReason());
        log.info("Order status changed: orderId={}, orderNumber={}, from={}, to={}, by={}",
                order.getId(), order.getOrderNumber(), oldStatus, newStatus, request.getStaffId());

        emitStatusNotification(order, newStatus);
        return orderMapper.toResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long orderId) {
        Order order = fetchOrder(orderId);
        Order.OrderStatus oldStatus = order.getStatus();

        if (oldStatus == Order.OrderStatus.SERVED || oldStatus == Order.OrderStatus.CANCELLED) {
            throw new BusinessException("Cannot cancel order in terminal state: " + oldStatus);
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());
        order = orderRepository.save(order);

        persistStatusHistory(order, oldStatus, Order.OrderStatus.CANCELLED, null, "Cancelled by customer");
        log.info("Order cancelled: orderId={}, orderNumber={}", order.getId(), order.getOrderNumber());

        notificationService.pushOrderEvent(order, "ORDER_CANCELLED", "/topic/customer/" + order.getCustomer().getId());
        notificationService.pushOrderEvent(order, "ORDER_CANCELLED", "/topic/chef/" + order.getCafe().getId());
        return orderMapper.toResponse(order);
    }


    @Override
    @Transactional
    public OrderResponse activateOrderAfterPayment(Long orderId) {
        Order order = fetchOrder(orderId);

        // Idempotency: if already PLACED or beyond, payment was already processed
        if (order.getStatus() != Order.OrderStatus.PENDING_PAYMENT) {
            log.warn("activateOrderAfterPayment: order {} already in status {}, returning idempotent response",
                    order.getOrderNumber(), order.getStatus());
            return orderMapper.toResponse(order);
        }

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new BusinessException("No payment record found for orderId=" + orderId));

        if (!payment.isSuccessful()) {
            log.warn("Payment validation failed: orderId={}, paymentStatus={}", orderId, payment.getStatus());
            throw new BusinessException(
                    "Cannot activate order: payment status is " + payment.getStatus() +
                    ". Only COMPLETED payments can activate kitchen flow.");
        }

        // Transition: PENDING_PAYMENT → PLACED
        order.setStatus(Order.OrderStatus.PLACED);
        order.setPlacedAt(LocalDateTime.now());
        order = orderRepository.save(order);

        persistStatusHistory(order, Order.OrderStatus.PENDING_PAYMENT, Order.OrderStatus.PLACED,
                order.getCustomer().getId(), "Payment verified — order activated");

        log.info("Payment verified, order PLACED in kitchen queue: orderId={}, paymentId={}, gatewayPaymentId={}",
                orderId, payment.getId(), payment.getPaymentGatewayPaymentId());

        // Now it is safe to notify the chef
        notificationService.pushOrderEvent(order, "ORDER_PLACED", "/topic/chef/" + order.getCafe().getId());
        // Also notify the customer that their order is confirmed
        notificationService.pushOrderEvent(order, "ORDER_CONFIRMED", "/topic/customer/" + order.getCustomer().getId());
        return orderMapper.toResponse(order);
    }


    private Order fetchOrder(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
    }

    private void validateBookingOwnership(Booking booking, Long customerId) {
        if (!booking.getCustomer().getId().equals(customerId)) {
            throw new BusinessException("Booking " + booking.getId() + " does not belong to customer " + customerId);
        }
    }

    private void validateBookingIsConfirmed(Booking booking) {
        if (booking.getStatus() != Booking.BookingStatus.CONFIRMED) {
            throw new BusinessException("Booking must be CONFIRMED to place an order. Current status: " + booking.getStatus());
        }
    }

    private void assertNoExistingOrder(Long bookingId) {
        if (orderRepository.existsByBookingId(bookingId)) {
            throw new BusinessException("An order already exists for bookingId=" + bookingId);
        }
    }

    private Order buildOrder(OrderRequest request, Booking booking) {
        Order order = new Order();
        order.setOrderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.setBooking(booking);
        order.setCustomer(booking.getCustomer());
        order.setCafe(booking.getCafe());
        order.setStatus(Order.OrderStatus.PENDING_PAYMENT);
        order.setSpecialInstructions(request.getSpecialInstructions());

        List<OrderItem> items = buildOrderItems(request.getItems(), order, booking.getCafe().getId());
        order.setOrderItems(items);

        BigDecimal subtotal = items.stream()
                .map(OrderItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setSubtotal(subtotal);
        order.setTax(subtotal.multiply(new BigDecimal("0.10")));
        order.setDiscount(BigDecimal.ZERO);
        order.setTotalAmount(subtotal.add(order.getTax()));
        return order;
    }

    private List<OrderItem> buildOrderItems(List<OrderRequest.OrderItemRequest> itemRequests,
                                            Order order, Long cafeId) {
        return itemRequests.stream().map(itemRequest -> {
            MenuItem menuItem = menuItemRepository.findById(itemRequest.getMenuItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Menu item not found: " + itemRequest.getMenuItemId()));

            if (!menuItem.getCafe().getId().equals(cafeId)) {
                throw new BusinessException("Menu item " + menuItem.getId() + " does not belong to this cafe");
            }
            if (!menuItem.getIsAvailable()) {
                throw new BusinessException("Menu item is not available: " + menuItem.getName());
            }

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setMenuItem(menuItem);
            item.setQuantity(itemRequest.getQuantity());
            item.setUnitPrice(menuItem.getPrice());
            item.setTotalPrice(menuItem.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity())));
            item.setSpecialInstructions(itemRequest.getSpecialInstructions());
            return item;
        }).collect(Collectors.toList());
    }

    private Order.OrderStatus parseStatus(String status) {
        try {
            return Order.OrderStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Unknown order status: " + status);
        }
    }

    private void validateTransition(Order.OrderStatus from, Order.OrderStatus to) {
        Set<Order.OrderStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(from, EnumSet.noneOf(Order.OrderStatus.class));
        if (!allowed.contains(to)) {
            throw new BusinessException(
                    "Invalid status transition from " + from + " to " + to +
                    ". Allowed next states: " + allowed);
        }
    }

    private void applyStatusTimestamps(Order order, Order.OrderStatus newStatus, OrderStatusUpdateRequest request) {
        switch (newStatus) {
            case PREPARING -> {
                if (order.getPreparingAt() == null) order.setPreparingAt(LocalDateTime.now());
                if (request.getStaffId() != null) {
                    order.setPreparingByChef(userRepository.findById(request.getStaffId())
                            .orElseThrow(() -> new ResourceNotFoundException("Chef not found: " + request.getStaffId())));
                }
            }
            case READY -> { if (order.getReadyAt() == null) order.setReadyAt(LocalDateTime.now()); }
            case SERVED -> {
                if (order.getServedAt() == null) order.setServedAt(LocalDateTime.now());
                if (request.getStaffId() != null) {
                    order.setServedByWaiter(userRepository.findById(request.getStaffId())
                            .orElseThrow(() -> new ResourceNotFoundException("Waiter not found: " + request.getStaffId())));
                }
            }
            case CANCELLED -> {
                order.setCancelledAt(LocalDateTime.now());
                order.setCancellationReason(request.getReason());
            }
            default -> { /* PLACED / PENDING_PAYMENT – no timestamp action needed */ }
        }
        order.setStatus(newStatus);
    }

    private void emitStatusNotification(Order order, Order.OrderStatus newStatus) {
        switch (newStatus) {
            case PENDING_PAYMENT -> { /* no external notification — awaiting payment */ }
            case PLACED     -> notificationService.pushOrderEvent(order, "ORDER_PLACED",    "/topic/cafe/"     + order.getCafe().getId());
            case PREPARING  -> notificationService.pushOrderEvent(order, "ORDER_PREPARING", "/topic/customer/" + order.getCustomer().getId());
            case READY      -> {
                notificationService.pushOrderEvent(order, "ORDER_READY", "/topic/waiter/"   + order.getCafe().getId());
                notificationService.pushOrderEvent(order, "ORDER_READY", "/topic/customer/" + order.getCustomer().getId());
            }
            case SERVED     -> notificationService.pushOrderEvent(order, "ORDER_SERVED",    "/topic/customer/" + order.getCustomer().getId());
            case CANCELLED  -> {
                notificationService.pushOrderEvent(order, "ORDER_CANCELLED", "/topic/customer/" + order.getCustomer().getId());
                notificationService.pushOrderEvent(order, "ORDER_CANCELLED", "/topic/chef/"     + order.getCafe().getId());
            }
        }
    }

    private void persistStatusHistory(Order order, Order.OrderStatus oldStatus,
                                      Order.OrderStatus newStatus, Long changedByUserId, String reason) {
        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .changedByUserId(changedByUserId)
                .changedAt(LocalDateTime.now())
                .reason(reason)
                .build();
        statusHistoryRepository.save(history);
    }
}
