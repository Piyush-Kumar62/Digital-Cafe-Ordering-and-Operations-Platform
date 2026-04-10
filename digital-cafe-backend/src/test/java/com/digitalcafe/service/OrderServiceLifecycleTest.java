package com.digitalcafe.service;

import com.digitalcafe.dto.request.OrderStatusUpdateRequest;
import com.digitalcafe.dto.response.OrderResponse;
import com.digitalcafe.entity.Cafe;
import com.digitalcafe.entity.Order;
import com.digitalcafe.entity.User;
import com.digitalcafe.exception.BusinessException;
import com.digitalcafe.mapper.OrderMapper;
import com.digitalcafe.repository.BookingRepository;
import com.digitalcafe.repository.MenuItemRepository;
import com.digitalcafe.repository.OrderRepository;
import com.digitalcafe.repository.OrderStatusHistoryRepository;
import com.digitalcafe.repository.PaymentRepository;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.impl.OrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceLifecycleTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private MenuItemRepository menuItemRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private OrderStatusHistoryRepository statusHistoryRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private OrderMapper orderMapper;
    @Mock
    private EmailService emailService;

    private OrderServiceImpl orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderServiceImpl(
                orderRepository,
                bookingRepository,
                menuItemRepository,
                userRepository,
                paymentRepository,
                statusHistoryRepository,
                notificationService,
                orderMapper,
                emailService
        );
    }

    @Test
    void shouldAllowPlacedToPreparingTransition() {
        Order order = new Order();
        order.setId(10L);
        order.setOrderNumber("ORD-10");
        order.setStatus(Order.OrderStatus.PLACED);
        Cafe cafe = new Cafe();
        cafe.setId(5L);
        User customer = new User();
        customer.setId(7L);
        customer.setEmail("customer@test.com");
        order.setCafe(cafe);
        order.setCustomer(customer);

        OrderResponse mapped = OrderResponse.builder()
                .id(10L)
                .status(Order.OrderStatus.PREPARING)
                .build();

        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderMapper.toResponse(any(Order.class))).thenReturn(mapped);

        OrderStatusUpdateRequest request = OrderStatusUpdateRequest.builder()
                .status(Order.OrderStatus.PREPARING.name())
                .build();

        OrderResponse response = orderService.updateOrderStatus(10L, request);

        assertThat(response.getStatus()).isEqualTo(Order.OrderStatus.PREPARING);
        assertThat(order.getStatus()).isEqualTo(Order.OrderStatus.PREPARING);
        verify(notificationService, times(5)).pushOrderEvent(any(Order.class), eq("ORDER_PREPARING"), any());
    }

    @Test
    void shouldRejectInvalidStatusTransition() {
        Order order = new Order();
        order.setId(20L);
        order.setOrderNumber("ORD-20");
        order.setStatus(Order.OrderStatus.PENDING_PAYMENT);

        when(orderRepository.findById(20L)).thenReturn(Optional.of(order));

        OrderStatusUpdateRequest request = OrderStatusUpdateRequest.builder()
                .status(Order.OrderStatus.READY.name())
                .build();

        assertThatThrownBy(() -> orderService.updateOrderStatus(20L, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Invalid status transition");
    }
}
