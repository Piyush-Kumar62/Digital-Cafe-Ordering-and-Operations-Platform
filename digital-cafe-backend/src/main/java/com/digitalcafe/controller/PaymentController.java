package com.digitalcafe.controller;

import com.digitalcafe.dto.PaymentRequestDTO;
import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.PaymentResponse;
import com.digitalcafe.entity.Order;
import com.digitalcafe.entity.Payment;
import com.digitalcafe.mapper.PaymentMapper;
import com.digitalcafe.payment.PaymentService;
import com.digitalcafe.repository.OrderRepository;
import com.digitalcafe.repository.PaymentRepository;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;


@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentMapper paymentMapper;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final OrderService orderService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(
            @Valid @RequestBody PaymentRequestDTO request) {
        Long customerId = getAuthenticatedUserId();
        Order order = getOrderForCustomer(request.getOrderId(), customerId);

        Payment payment = paymentService.createPayment(order);
        if (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()) {
            try {
                payment.setPaymentMethod(Payment.PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase()));
            } catch (IllegalArgumentException ignored) {
                // Keep default/null payment method if client sends unsupported value.
            }
        }
        PaymentResponse response = paymentMapper.toResponse(payment);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment initiated successfully", response));
    }

    @GetMapping("/{paymentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER', 'CAFE_OWNER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentById(@PathVariable Long paymentId) {
        Payment payment = paymentRepository.findByIdWithOrder(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        validateCustomerPaymentAccess(payment);
        PaymentResponse response = paymentMapper.toResponse(payment);
        return ResponseEntity.ok(ApiResponse.success("Payment retrieved successfully", response));
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER', 'CAFE_OWNER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByOrderId(@PathVariable Long orderId) {
        Payment payment = paymentService.getPaymentByOrderId(orderId);
        payment = paymentRepository.findByIdWithOrder(payment.getId())
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        validateCustomerPaymentAccess(payment);
        PaymentResponse response = paymentMapper.toResponse(payment);
        return ResponseEntity.ok(ApiResponse.success("Payment retrieved successfully", response));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getMyPayments() {
        Long customerId = getAuthenticatedUserId();
        List<Payment> payments = paymentRepository.findByCustomerId(customerId);
        List<PaymentResponse> response = paymentMapper.toResponseList(payments);
        return ResponseEntity.ok(ApiResponse.success("Payments retrieved successfully", response));
    }

    @PostMapping("/{paymentId}/verify")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> verifyPayment(
            @PathVariable Long paymentId,
            @RequestBody Map<String, String> request) {
        String paymentGatewayPaymentId = request.get("paymentGatewayPaymentId");
        String signature = request.get("signature");

        Payment existingPayment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        validateCustomerPaymentAccess(existingPayment);

        paymentService.verifyAndCompletePayment(paymentId, paymentGatewayPaymentId, signature);
        Payment payment = paymentRepository.findByIdWithOrder(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        orderService.activateOrderAfterPayment(payment.getOrder().getId());
        PaymentResponse response = paymentMapper.toResponse(payment);

        return ResponseEntity.ok(ApiResponse.success("Payment verified successfully", response));
    }

    @PostMapping("/{paymentId}/fail")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> markPaymentFailed(
            @PathVariable Long paymentId,
            @RequestBody(required = false) Map<String, String> request) {
        Payment existingPayment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        validateCustomerPaymentAccess(existingPayment);

        String reason = request != null ? request.getOrDefault("reason", "Payment failed") : "Payment failed";
        paymentService.handlePaymentFailure(paymentId, reason);
        Payment payment = paymentRepository.findByIdWithOrder(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        PaymentResponse response = paymentMapper.toResponse(payment);

        return ResponseEntity.ok(ApiResponse.success("Payment marked as failed", response));
    }

    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"))
                .getId();
    }

    private Order getOrderForCustomer(Long orderId, Long customerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        if (!order.getCustomer().getId().equals(customerId)) {
            throw new IllegalArgumentException("Order does not belong to authenticated customer");
        }
        return order;
    }

    private void validateCustomerPaymentAccess(Payment payment) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isCustomer = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_CUSTOMER"::equals);
        if (!isCustomer) {
            return;
        }

        Long customerId = getAuthenticatedUserId();
        Long paymentCustomerId = paymentRepository.findCustomerIdByPaymentId(payment.getId())
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        if (!paymentCustomerId.equals(customerId)) {
            throw new IllegalArgumentException("Payment does not belong to authenticated customer");
        }
    }
}
