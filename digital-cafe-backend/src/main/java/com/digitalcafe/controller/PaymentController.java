package com.digitalcafe.controller;

import com.digitalcafe.dto.PaymentRequestDTO;
import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.PaymentResponse;
import com.digitalcafe.entity.Order;
import com.digitalcafe.entity.Payment;
import com.digitalcafe.mapper.PaymentMapper;
import com.digitalcafe.payment.PaymentService;
import com.digitalcafe.service.OrderService;
import com.digitalcafe.service.UserService;
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
    private final OrderService orderService;
    private final UserService userService;

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
        Payment payment = paymentService.findByIdWithOrder(paymentId);
        validateCustomerPaymentAccess(payment);
        PaymentResponse response = paymentMapper.toResponse(payment);
        return ResponseEntity.ok(ApiResponse.success("Payment retrieved successfully", response));
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER', 'CAFE_OWNER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByOrderId(@PathVariable Long orderId) {
        Payment payment = paymentService.findByIdWithOrder(paymentService.getPaymentByOrderId(orderId).getId());
        validateCustomerPaymentAccess(payment);
        PaymentResponse response = paymentMapper.toResponse(payment);
        return ResponseEntity.ok(ApiResponse.success("Payment retrieved successfully", response));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getMyPayments() {
        Long customerId = getAuthenticatedUserId();
        List<Payment> payments = paymentService.getPaymentsByCustomerId(customerId);
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

        Payment existingPayment = paymentService.findById(paymentId);
        validateCustomerPaymentAccess(existingPayment);

        paymentService.verifyAndCompletePayment(paymentId, paymentGatewayPaymentId, signature);
        Payment payment = paymentService.findByIdWithOrder(paymentId);
        orderService.activateOrderAfterPayment(payment.getOrder().getId());
        PaymentResponse response = paymentMapper.toResponse(payment);

        return ResponseEntity.ok(ApiResponse.success("Payment verified successfully", response));
    }

    @PostMapping("/{paymentId}/fail")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> markPaymentFailed(
            @PathVariable Long paymentId,
            @RequestBody(required = false) Map<String, String> request) {
        Payment existingPayment = paymentService.findById(paymentId);
        validateCustomerPaymentAccess(existingPayment);

        String reason = request != null ? request.getOrDefault("reason", "Payment failed") : "Payment failed";
        paymentService.handlePaymentFailure(paymentId, reason);
        Payment payment = paymentService.findByIdWithOrder(paymentId);
        PaymentResponse response = paymentMapper.toResponse(payment);

        return ResponseEntity.ok(ApiResponse.success("Payment marked as failed", response));
    }

    private Long getAuthenticatedUserId() {
        return userService.getCurrentUserId();
    }

    private Order getOrderForCustomer(Long orderId, Long customerId) {
        orderService.validateOrderOwnership(orderId, customerId);
        return orderService.getOrderEntity(orderId);
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
        Long paymentCustomerId = paymentService.getCustomerIdByPaymentId(payment.getId());
        if (!paymentCustomerId.equals(customerId)) {
            throw new IllegalArgumentException("Payment does not belong to authenticated customer");
        }
    }
}
