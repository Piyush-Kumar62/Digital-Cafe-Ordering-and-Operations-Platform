package com.digitalcafe.controller;

import com.digitalcafe.dto.PaymentRequestDTO;
import com.digitalcafe.dto.response.OrderResponse;
import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.PaymentResponse;
import com.digitalcafe.entity.Order;
import com.digitalcafe.entity.Payment;
import com.digitalcafe.mapper.PaymentMapper;
import com.digitalcafe.payment.PaymentService;
import com.digitalcafe.service.EmailService;
import com.digitalcafe.service.OrderService;
import com.digitalcafe.service.UserService;
import com.digitalcafe.util.PaymentReceiptPdfGenerator;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentMapper paymentMapper;
    private final OrderService orderService;
    private final UserService userService;
    private final EmailService emailService;

    private static final DateTimeFormatter RECEIPT_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(
            @Valid @RequestBody PaymentRequestDTO request) {
        Long customerId = getAuthenticatedUserId();
        Order order = getOrderForCustomer(request.getOrderId(), customerId);

        Payment payment = paymentService.createPayment(order, request.getPaymentMethod());
        boolean completedNow = false;

        // In TEST mode, auto-complete and activate order immediately so local/demo checkout works end-to-end.
        if ("TEST".equalsIgnoreCase(payment.getPaymentGateway())) {
            if (!payment.isSuccessful()) {
                payment = paymentService.verifyAndCompletePayment(
                        payment.getId(),
                        "SIM-" + payment.getId() + "-" + System.currentTimeMillis(),
                        "SIMULATED_SIGNATURE"
                );
                completedNow = true;
            }
            orderService.activateOrderAfterPayment(order.getId());
            if (completedNow) {
                sendPaymentReceiptEmail(payment, authenticationEmail(), "TEST");
            }
        }

        Payment responseEntity = paymentService.findByIdWithOrder(payment.getId());
        PaymentResponse response = paymentMapper.toResponse(responseEntity);

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

    @GetMapping("/{paymentId}/receipt")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER', 'CAFE_OWNER')")
    public ResponseEntity<byte[]> downloadPaymentReceipt(@PathVariable Long paymentId) {
        Payment payment = paymentService.findByIdWithOrder(paymentId);
        validateCustomerPaymentAccess(payment);

        Long orderId = payment.getOrder() != null ? payment.getOrder().getId() : null;
        if (orderId == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        OrderResponse order = orderService.getOrderById(orderId);
        String customerName = order.getCustomerName() != null && !order.getCustomerName().isBlank()
                ? order.getCustomerName()
                : "Customer";
        String receiptNumber = resolveReceiptNumber(payment);
        String details = buildPaymentDetails(payment, order, resolveGatewayLabel(payment));

        byte[] pdf = PaymentReceiptPdfGenerator.generate(receiptNumber, customerName, details);
        String filename = "payment-receipt-" + receiptNumber + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(pdf);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getMyPayments() {
        Long customerId = getAuthenticatedUserId();
        List<Payment> payments = paymentService.getPaymentsByCustomerId(customerId);
        List<PaymentResponse> response = paymentMapper.toResponseList(payments);
        return ResponseEntity.ok(ApiResponse.success("Payments retrieved successfully", response));
    }

    @PostMapping("/webhook/razorpay")
    public ResponseEntity<String> processRazorpayWebhook(
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
            @RequestHeader(value = "X-Razorpay-Event-Id", required = false) String eventId,
            @RequestBody String rawPayload) {
        paymentService.enqueueRazorpayWebhook(rawPayload, signature, eventId);
        return ResponseEntity.ok("OK");
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
        if (existingPayment.isSuccessful()) {
            PaymentResponse alreadyCompleted = paymentMapper.toResponse(paymentService.findByIdWithOrder(paymentId));
            return ResponseEntity.ok(ApiResponse.success("Payment already verified", alreadyCompleted));
        }

        paymentService.verifyAndCompletePayment(paymentId, paymentGatewayPaymentId, signature);
        Payment payment = paymentService.findByIdWithOrder(paymentId);
        orderService.activateOrderAfterPayment(payment.getOrder().getId());
        sendPaymentReceiptEmail(payment, authenticationEmail(), "RAZORPAY");
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

    @PostMapping("/{paymentId}/receipt/email")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> resendPaymentReceiptEmail(@PathVariable Long paymentId) {
        Payment payment = paymentService.findByIdWithOrder(paymentId);
        validateCustomerPaymentAccess(payment);

        if (!payment.isSuccessful()) {
            throw new IllegalArgumentException("Receipt email can only be sent for completed payments");
        }

        sendPaymentReceiptEmail(payment, authenticationEmail(), resolveGatewayLabel(payment));
        PaymentResponse response = paymentMapper.toResponse(payment);
        return ResponseEntity.ok(ApiResponse.success("Payment receipt email sent", response));
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

    private String authenticationEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }

    private String resolveCustomerEmail(Payment payment) {
        if (payment == null || payment.getOrder() == null || payment.getOrder().getCustomer() == null) {
            return null;
        }
        return payment.getOrder().getCustomer().getEmail();
    }

    private void sendPaymentReceiptEmail(Payment payment, String customerEmail, String gatewayLabel) {
        if (customerEmail == null || customerEmail.isBlank()) {
            return;
        }

        Long orderId = payment.getOrder() != null ? payment.getOrder().getId() : null;
        if (orderId == null) {
            return;
        }

        OrderResponse order = orderService.getOrderById(orderId);
        String customerName = order.getCustomerName() != null && !order.getCustomerName().isBlank()
                ? order.getCustomerName()
                : "Customer";

        String receiptNumber = resolveReceiptNumber(payment);
        String details = buildPaymentDetails(payment, order, gatewayLabel);

        emailService.sendPaymentReceipt(customerEmail, customerName, receiptNumber, details);
    }

    private String resolveReceiptNumber(Payment payment) {
        return payment.getTransactionId() != null && !payment.getTransactionId().isBlank()
                ? payment.getTransactionId()
                : "RCPT-" + payment.getId();
    }

    private String resolveGatewayLabel(Payment payment) {
        if (payment.getPaymentGateway() == null || payment.getPaymentGateway().isBlank()) {
            return "-";
        }
        return payment.getPaymentGateway().trim().toUpperCase();
    }

    private String buildPaymentDetails(Payment payment, OrderResponse order, String gatewayLabel) {
        String completedAt = formatReceiptTime(payment.getCompletedAt());
        String method = payment.getPaymentMethod() != null ? payment.getPaymentMethod().name().replace('_', ' ') : "-";

        String itemLines = "-";
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            itemLines = order.getItems().stream()
                    .map(i -> String.format("%s x%s (INR %s)", safe(i.getMenuItemName()), i.getQuantity(), i.getTotalPrice()))
                    .collect(Collectors.joining("; "));
        }

        return String.format(
                "Order: %s%nCafe: %s%nAmount Paid: %s %s%nStatus: %s%nMethod: %s%nGateway: %s%nGateway Order ID: %s%nGateway Payment ID: %s%nPayment Time: %s%nBooking: %s%nItems: %s",
                safe(order.getOrderNumber()),
                safe(order.getCafeName()),
                safe(payment.getCurrency()),
                payment.getAmount() != null ? payment.getAmount().toPlainString() : "0.00",
                safe(payment.getStatus() != null ? payment.getStatus().name() : null),
                method,
                safe(gatewayLabel),
                safe(payment.getPaymentGatewayOrderId()),
                safe(payment.getPaymentGatewayPaymentId()),
                completedAt,
                safe(order.getBookingNumber()),
                itemLines
        );
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private String formatReceiptTime(LocalDateTime dateTime) {
        LocalDateTime effective = dateTime != null ? dateTime : LocalDateTime.now();
        return effective.format(RECEIPT_TIME_FORMATTER);
    }
}
