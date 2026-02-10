package com.digitalcafe.payment;

import com.digitalcafe.entity.Order;
import com.digitalcafe.entity.Payment;
import com.digitalcafe.exception.BusinessException;
import com.digitalcafe.repository.PaymentRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Payment service for Razorpay integration.
 * Handles payment creation, verification, and webhook processing.
 */
@Slf4j
@Service
public class PaymentService {

    @Value("${payment.gateway}")
    private String paymentGateway;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    private final PaymentRepository paymentRepository;
    private RazorpayClient razorpayClient;

    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    /**
     * Initializes Razorpay client if gateway is configured.
     */
    private void initializeRazorpayClient() {
        if (razorpayClient == null && "RAZORPAY".equals(paymentGateway)) {
            try {
                razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            } catch (RazorpayException e) {
                log.error("Failed to initialize Razorpay client", e);
                throw new BusinessException("Payment gateway initialization failed");
            }
        }
    }

    /**
     * Creates a payment order.
     */
    @Transactional
    public Payment createPayment(Order order) {
        log.info("Creating payment for order: {}", order.getOrderNumber());

        Payment payment = Payment.builder()
                .order(order)
                .amount(order.getTotalAmount())
                .currency("INR")
                .status(Payment.PaymentStatus.PENDING)
                .paymentGateway(paymentGateway)
                .initiatedAt(LocalDateTime.now())
                .build();

        // Generate transaction ID
        payment.setTransactionId("TXN-" + System.currentTimeMillis());

        if ("RAZORPAY".equals(paymentGateway)) {
            try {
                initializeRazorpayClient();
                String razorpayOrderId = createRazorpayOrder(order);
                payment.setPaymentGatewayOrderId(razorpayOrderId);
            } catch (Exception e) {
                log.error("Failed to create Razorpay order", e);
                throw new BusinessException("Failed to initiate payment", e);
            }
        } else if ("TEST".equals(paymentGateway)) {
            // Test mode - simulate payment gateway order ID
            payment.setPaymentGatewayOrderId("TEST-ORDER-" + System.currentTimeMillis());
            log.info("Test payment mode activated");
        }

        return paymentRepository.save(payment);
    }

    /**
     * Creates Razorpay order.
     */
    private String createRazorpayOrder(Order order) throws RazorpayException {
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", order.getTotalAmount().multiply(new BigDecimal("100")).intValue()); // Amount in paise
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", order.getOrderNumber());

        com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);
        return razorpayOrder.get("id");
    }

    /**
     * Verifies and completes payment.
     */
    @Transactional
    public Payment verifyAndCompletePayment(Long paymentId, String paymentGatewayPaymentId, String signature) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new BusinessException("Payment not found"));

        if (payment.getStatus() == Payment.PaymentStatus.COMPLETED) {
            throw new BusinessException("Payment already completed");
        }

        if ("RAZORPAY".equals(paymentGateway)) {
            try {
                initializeRazorpayClient();
                verifyRazorpaySignature(payment.getPaymentGatewayOrderId(), paymentGatewayPaymentId, signature);
            } catch (Exception e) {
                payment.markAsFailed("Signature verification failed: " + e.getMessage());
                paymentRepository.save(payment);
                throw new BusinessException("Payment verification failed", e);
            }
        }

        // Mark payment as completed
        payment.markAsCompleted(paymentGatewayPaymentId);
        payment.setWebhookSignature(signature);

        return paymentRepository.save(payment);
    }

    /**
     * Verifies Razorpay payment signature.
     */
    private void verifyRazorpaySignature(String orderId, String paymentId, String signature) throws Exception {
        JSONObject options = new JSONObject();
        options.put("razorpay_order_id", orderId);
        options.put("razorpay_payment_id", paymentId);
        options.put("razorpay_signature", signature);

        // Razorpay utility method for signature verification
        boolean isValid = com.razorpay.Utils.verifyPaymentSignature(options, razorpayKeySecret);

        if (!isValid) {
            throw new BusinessException("Invalid payment signature");
        }
    }

    /**
     * Handles payment failure.
     */
    @Transactional
    public Payment handlePaymentFailure(Long paymentId, String reason) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new BusinessException("Payment not found"));

        payment.markAsFailed(reason);
        return paymentRepository.save(payment);
    }

    /**
     * Retrieves payment by order ID.
     */
    public Payment getPaymentByOrderId(Long orderId) {
        return paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new BusinessException("Payment not found for order"));
    }
}
