package com.digitalcafe.controller;

import com.digitalcafe.dto.PaymentRequestDTO;
import com.digitalcafe.dto.response.OrderResponse;
import com.digitalcafe.dto.response.PaymentResponse;
import com.digitalcafe.entity.Order;
import com.digitalcafe.entity.Payment;
import com.digitalcafe.mapper.PaymentMapper;
import com.digitalcafe.payment.PaymentService;
import com.digitalcafe.security.JwtAuthenticationFilter;
import com.digitalcafe.security.JwtUtil;
import com.digitalcafe.security.ProfileCompletionFilter;
import com.digitalcafe.service.EmailService;
import com.digitalcafe.service.OrderService;
import com.digitalcafe.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PaymentController.class)
@AutoConfigureMockMvc(addFilters = false)
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PaymentService paymentService;

    @MockitoBean
    private PaymentMapper paymentMapper;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private ProfileCompletionFilter profileCompletionFilter;

    @MockitoBean
    private OrderService orderService;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private EmailService emailService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createPaymentShouldAutoCompleteInTestGateway() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("customer@test.com", "password", Collections.emptyList())
        );

        Order order = new Order();
        order.setId(55L);
        order.setOrderNumber("ORD-55");

        Payment payment = new Payment();
        payment.setId(101L);
        payment.setOrder(order);
        payment.setPaymentGateway("TEST");
        payment.setStatus(Payment.PaymentStatus.CREATED);
        payment.setAmount(new BigDecimal("199.00"));
        payment.setCurrency("INR");

        Payment completed = new Payment();
        completed.setId(101L);
        completed.setOrder(order);
        completed.setPaymentGateway("TEST");
        completed.setStatus(Payment.PaymentStatus.COMPLETED);
        completed.setAmount(new BigDecimal("199.00"));
        completed.setCurrency("INR");
        completed.setTransactionId("SIM-101");

        PaymentResponse mapped = PaymentResponse.builder()
                .id(101L)
                .status(Payment.PaymentStatus.COMPLETED.name())
                .build();

        when(userService.getCurrentUserId()).thenReturn(1L);
        doNothing().when(orderService).validateOrderOwnership(55L, 1L);
        when(orderService.getOrderEntity(55L)).thenReturn(order);
        when(paymentService.createPayment(eq(order), any())).thenReturn(payment);
        when(paymentService.verifyAndCompletePayment(eq(101L), any(), any())).thenReturn(completed);
        when(paymentService.findByIdWithOrder(101L)).thenReturn(completed);
        when(orderService.getOrderById(55L)).thenReturn(OrderResponse.builder()
                .id(55L)
                .orderNumber("ORD-55")
                .customerName("Customer")
                .build());
        when(paymentMapper.toResponse(any(Payment.class))).thenReturn(mapped);

        PaymentRequestDTO request = new PaymentRequestDTO();
        request.setOrderId(55L);
        request.setAmount(new BigDecimal("199.00"));
        request.setPaymentMethod("UPI");

        mockMvc.perform(post("/api/payments")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        verify(paymentService).verifyAndCompletePayment(eq(101L), any(), any());
        verify(orderService).activateOrderAfterPayment(55L);
        verify(emailService).sendPaymentReceipt(eq("customer@test.com"), any(), any(), any());
    }
}

