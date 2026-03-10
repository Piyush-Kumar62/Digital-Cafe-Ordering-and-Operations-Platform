package com.digitalcafe.payment;

import com.digitalcafe.entity.Order;
import com.digitalcafe.entity.Payment;
import com.digitalcafe.entity.PaymentWebhookEvent;
import com.digitalcafe.exception.BusinessException;
import com.digitalcafe.repository.PaymentRepository;
import com.digitalcafe.repository.PaymentWebhookEventRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;


@Slf4j
@Service
public class PaymentService {

    @Value("${payment.gateway}")
    private String paymentGateway;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    @Value("${razorpay.webhook.secret:}")
    private String razorpayWebhookSecret;

    private final PaymentRepository paymentRepository;
    private final PaymentWebhookEventRepository webhookEventRepository;
    private RazorpayClient razorpayClient;

    public PaymentService(PaymentRepository paymentRepository, PaymentWebhookEventRepository webhookEventRepository) {
        this.paymentRepository = paymentRepository;
        this.webhookEventRepository = webhookEventRepository;
    }

    private boolean isGateway(String expected) {
        return paymentGateway != null && paymentGateway.trim().equalsIgnoreCase(expected);
    }


    private void initializeRazorpayClient() {
        if (razorpayClient == null && isGateway("RAZORPAY")) {
            try {
                razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            } catch (RazorpayException e) {
                log.error("Failed to initialize Razorpay client", e);
                throw new BusinessException("Payment gateway initialization failed");
            }
        }
    }


    @Transactional
    public Payment createPayment(Order order) {
        return createPayment(order, null);
    }

    @Transactional
    public Payment createPayment(Order order, String requestedPaymentMethod) {
        log.info("Creating payment for order: {}", order.getOrderNumber());
        Payment.PaymentMethod normalizedMethod = normalizePaymentMethod(requestedPaymentMethod);

        // Idempotency: reuse existing payment instead of throwing hard errors on repeated clicks.
        var existingOpt = paymentRepository.findByOrderId(order.getId());
        if (existingOpt.isPresent()) {
            Payment existing = existingOpt.get();
            if (existing.getStatus() == Payment.PaymentStatus.COMPLETED
                    || existing.getStatus() == Payment.PaymentStatus.PENDING
                    || existing.getStatus() == Payment.PaymentStatus.PROCESSING) {
                if (normalizedMethod != null && existing.getPaymentMethod() != normalizedMethod) {
                    existing.setPaymentMethod(normalizedMethod);
                    return paymentRepository.save(existing);
                }
                return existing;
            }
            // FAILED/CANCELLED/REFUNDED -> reset and reuse same row (order_id is one-to-one unique).
            existing.setStatus(Payment.PaymentStatus.PENDING);
            existing.setFailureReason(null);
            existing.setFailedAt(null);
            existing.setCompletedAt(null);
            existing.setWebhookSignature(null);
            existing.setPaymentGatewayPaymentId(null);
            existing.setInitiatedAt(LocalDateTime.now());
            existing.setPaymentMethod(normalizedMethod);
            existing.setTransactionId(
                    "TXN-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase()
            );

            if (isGateway("TEST")) {
                existing.setPaymentGatewayOrderId(
                        "TEST-ORDER-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase()
                );
            } else if (isGateway("RAZORPAY")) {
                try {
                    initializeRazorpayClient();
                    String razorpayOrderId = createRazorpayOrder(order);
                    existing.setPaymentGatewayOrderId(razorpayOrderId);
                } catch (Exception e) {
                    log.error("Failed to recreate Razorpay order for retry", e);
                    throw new BusinessException("Failed to re-initiate payment", e);
                }
            }

            return paymentRepository.save(existing);
        }

        Payment payment = Payment.builder()
                .order(order)
                .amount(order.getTotalAmount())
                .currency("INR")
                .status(Payment.PaymentStatus.PENDING)
                .paymentMethod(normalizedMethod)
                .paymentGateway(paymentGateway)
                .initiatedAt(LocalDateTime.now())
                .build();

        // Generate transaction ID
        payment.setTransactionId("TXN-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase());

        if (isGateway("RAZORPAY")) {
            try {
                initializeRazorpayClient();
                String razorpayOrderId = createRazorpayOrder(order);
                payment.setPaymentGatewayOrderId(razorpayOrderId);
            } catch (Exception e) {
                log.error("Failed to create Razorpay order", e);
                throw new BusinessException("Failed to initiate payment", e);
            }
        } else if (isGateway("TEST")) {
            // Test mode - simulate payment gateway order ID
            payment.setPaymentGatewayOrderId("TEST-ORDER-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase());
            log.info("Test payment mode activated");
        }

        return paymentRepository.save(payment);
    }

    private Payment.PaymentMethod normalizePaymentMethod(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return switch (value.trim().toUpperCase()) {
            case "UPI" -> Payment.PaymentMethod.UPI;
            case "CARD", "CREDIT_CARD" -> Payment.PaymentMethod.CREDIT_CARD;
            case "DEBIT_CARD" -> Payment.PaymentMethod.DEBIT_CARD;
            case "NET_BANKING" -> Payment.PaymentMethod.NET_BANKING;
            case "WALLET" -> Payment.PaymentMethod.WALLET;
            case "CASH", "OTHER" -> Payment.PaymentMethod.OTHER;
            default -> null;
        };
    }


    private String createRazorpayOrder(Order order) throws RazorpayException {
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", order.getTotalAmount().multiply(new BigDecimal("100")).intValue()); // Amount in paise
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", order.getOrderNumber());

        com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);
        return razorpayOrder.get("id");
    }


    @Transactional
    public Payment verifyAndCompletePayment(Long paymentId, String paymentGatewayPaymentId, String signature) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new BusinessException("Payment not found"));

        if (payment.getStatus() == Payment.PaymentStatus.COMPLETED) {
            throw new BusinessException("Payment already completed");
        }

        // Prevent duplicate gateway payment ID (webhook replay / double-click)
        if (paymentGatewayPaymentId != null && !paymentGatewayPaymentId.startsWith("SIM-")
                && paymentRepository.existsByPaymentGatewayPaymentId(paymentGatewayPaymentId)) {
            throw new BusinessException("This payment has already been processed (duplicate gateway payment ID)");
        }

        if (isGateway("RAZORPAY")) {
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


    @Transactional
    public Payment handlePaymentFailure(Long paymentId, String reason) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new BusinessException("Payment not found"));

        payment.markAsFailed(reason);
        return paymentRepository.save(payment);
    }


    public Payment getPaymentByOrderId(Long orderId) {
        return paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new BusinessException("Payment not found for order"));
    }

    /**
     * Fetch payment by ID (throws if not found).
     */
    public Payment findById(Long paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new BusinessException("Payment not found"));
    }

    /**
     * Fetch payment by ID with order eagerly loaded (throws if not found).
     */
    public Payment findByIdWithOrder(Long paymentId) {
        return paymentRepository.findByIdWithOrder(paymentId)
                .orElseThrow(() -> new BusinessException("Payment not found"));
    }

    /**
     * Returns all payments belonging to the given customer.
     */
    @Transactional(readOnly = true)
    public List<Payment> getPaymentsByCustomerId(Long customerId) {
        return paymentRepository.findByCustomerId(customerId);
    }

    /**
     * Returns the customer ID that owns a given payment, for authorization checks.
     */
    public Long getCustomerIdByPaymentId(Long paymentId) {
        return paymentRepository.findCustomerIdByPaymentId(paymentId)
                .orElseThrow(() -> new BusinessException("Payment not found"));
    }

    public Payment findByIdWithOrderAndCustomer(Long paymentId) {
        return paymentRepository.findByIdWithOrderAndCustomer(paymentId)
                .orElseThrow(() -> new BusinessException("Payment not found"));
    }

    @Transactional
    public WebhookProcessingResult processRazorpayWebhook(String rawPayload, String webhookSignature, String webhookEventId) {
        if (!isGateway("RAZORPAY")) {
            throw new BusinessException("Razorpay webhook is disabled because payment gateway is not RAZORPAY");
        }
        if (rawPayload == null || rawPayload.isBlank()) {
            throw new BusinessException("Webhook payload is empty");
        }

        JSONObject root = new JSONObject(rawPayload);
        String event = root.optString("event", "");
        JSONObject paymentEntity = root
                .optJSONObject("payload")
                .optJSONObject("payment")
                .optJSONObject("entity");

        PaymentWebhookEvent webhookEvent = upsertWebhookEvent(
                webhookEventId,
                event,
                hashSha256(safeString(webhookSignature)),
                rawPayload
        );

        try {
            verifyWebhookSignature(rawPayload, webhookSignature);
        } catch (Exception signatureEx) {
            markWebhookEvent(
                    webhookEvent,
                    PaymentWebhookEvent.ProcessingStatus.SIGNATURE_INVALID,
                    null,
                    null,
                    null,
                    signatureEx.getMessage()
            );
            throw signatureEx;
        }

        if (paymentEntity == null) {
            markWebhookEvent(
                    webhookEvent,
                    PaymentWebhookEvent.ProcessingStatus.FAILED,
                    null,
                    null,
                    null,
                    "Invalid webhook payload: missing payload.payment.entity"
            );
            throw new BusinessException("Invalid webhook payload: missing payload.payment.entity");
        }

        String gatewayOrderId = paymentEntity.optString("order_id", null);
        String gatewayPaymentId = paymentEntity.optString("id", null);
        if (gatewayOrderId == null || gatewayOrderId.isBlank()) {
            markWebhookEvent(
                    webhookEvent,
                    PaymentWebhookEvent.ProcessingStatus.FAILED,
                    null,
                    null,
                    gatewayPaymentId,
                    "Invalid webhook payload: missing Razorpay order ID"
            );
            throw new BusinessException("Invalid webhook payload: missing Razorpay order ID");
        }

        Payment payment = paymentRepository.findByGatewayOrderIdWithOrderAndCustomer(gatewayOrderId)
                .orElse(null);
        if (payment == null) {
            markWebhookEvent(
                    webhookEvent,
                    PaymentWebhookEvent.ProcessingStatus.FAILED,
                    null,
                    gatewayOrderId,
                    gatewayPaymentId,
                    "Payment not found for gateway order ID: " + gatewayOrderId
            );
            throw new BusinessException("Payment not found for gateway order ID: " + gatewayOrderId);
        }

        payment.setWebhookSignature(webhookSignature);
        payment.setGatewayResponse(rawPayload);

        boolean completedNow = false;
        boolean failedNow = false;

        if ("payment.captured".equalsIgnoreCase(event)) {
            OptionalDuplicate duplicate = checkDuplicateGatewayPaymentId(gatewayPaymentId, payment.getId());
            if (duplicate.isDuplicate()) {
                markWebhookEvent(
                        webhookEvent,
                        PaymentWebhookEvent.ProcessingStatus.IGNORED,
                        payment,
                        gatewayOrderId,
                        gatewayPaymentId,
                        "Duplicate gateway payment ID delivery"
                );
                return new WebhookProcessingResult(payment, false, false, event);
            }

            if (payment.getStatus() != Payment.PaymentStatus.COMPLETED) {
                payment.markAsCompleted(gatewayPaymentId);
                completedNow = true;
            } else if (gatewayPaymentId != null && !gatewayPaymentId.isBlank()) {
                payment.setPaymentGatewayPaymentId(gatewayPaymentId);
            }

            Payment.PaymentMethod webhookMethod = normalizePaymentMethod(paymentEntity.optString("method", null));
            if (webhookMethod != null) {
                payment.setPaymentMethod(webhookMethod);
            }

            payment.setFailureReason(null);
            payment.setFailedAt(null);
            paymentRepository.save(payment);
            markWebhookEvent(
                    webhookEvent,
                    PaymentWebhookEvent.ProcessingStatus.PROCESSED,
                    payment,
                    gatewayOrderId,
                    gatewayPaymentId,
                    null
            );
            return new WebhookProcessingResult(payment, completedNow, false, event);
        }

        if ("payment.failed".equalsIgnoreCase(event)) {
            if (payment.getStatus() != Payment.PaymentStatus.COMPLETED
                    && payment.getStatus() != Payment.PaymentStatus.REFUNDED) {
                String reason = paymentEntity.optString("error_description", "Payment failed on Razorpay");
                payment.markAsFailed(reason);
                paymentRepository.save(payment);
                failedNow = true;
            } else {
                paymentRepository.save(payment);
            }
            markWebhookEvent(
                    webhookEvent,
                    PaymentWebhookEvent.ProcessingStatus.PROCESSED,
                    payment,
                    gatewayOrderId,
                    gatewayPaymentId,
                    null
            );
            return new WebhookProcessingResult(payment, false, failedNow, event);
        }

        paymentRepository.save(payment);
        markWebhookEvent(
                webhookEvent,
                PaymentWebhookEvent.ProcessingStatus.IGNORED,
                payment,
                gatewayOrderId,
                gatewayPaymentId,
                "Unsupported webhook event: " + event
        );
        return new WebhookProcessingResult(payment, false, false, event);
    }

    private void verifyWebhookSignature(String payload, String signature) {
        if (signature == null || signature.isBlank()) {
            throw new BusinessException("Missing Razorpay webhook signature");
        }
        if (razorpayWebhookSecret == null || razorpayWebhookSecret.isBlank()) {
            throw new BusinessException("Razorpay webhook secret is not configured");
        }

        try {
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(
                    razorpayWebhookSecret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );
            sha256Hmac.init(secretKey);
            byte[] hash = sha256Hmac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expected = bytesToHex(hash);
            boolean valid = MessageDigest.isEqual(
                    expected.toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8),
                    signature.toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8)
            );
            if (!valid) {
                throw new BusinessException("Invalid Razorpay webhook signature");
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("Unable to verify Razorpay webhook signature", e);
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private PaymentWebhookEvent upsertWebhookEvent(
            String webhookEventId,
            String eventType,
            String signatureHash,
            String payload
    ) {
        String normalizedEventId = (webhookEventId == null || webhookEventId.isBlank())
                ? "AUTO-" + UUID.randomUUID()
                : webhookEventId.trim();

        Optional<PaymentWebhookEvent> existingOpt =
                webhookEventRepository.findByProviderAndEventId(PaymentWebhookEvent.Provider.RAZORPAY, normalizedEventId);

        PaymentWebhookEvent event = existingOpt.orElseGet(() -> PaymentWebhookEvent.builder()
                .provider(PaymentWebhookEvent.Provider.RAZORPAY)
                .eventId(normalizedEventId)
                .attemptCount(0)
                .build());

        event.setEventType(eventType);
        event.setSignatureHash(signatureHash);
        event.setPayload(payload);
        event.setStatus(PaymentWebhookEvent.ProcessingStatus.RECEIVED);
        event.setLastError(null);
        event.setAttemptCount((event.getAttemptCount() == null ? 0 : event.getAttemptCount()) + 1);
        event.setProcessedAt(null);

        return webhookEventRepository.save(event);
    }

    private void markWebhookEvent(
            PaymentWebhookEvent event,
            PaymentWebhookEvent.ProcessingStatus status,
            Payment payment,
            String gatewayOrderId,
            String gatewayPaymentId,
            String lastError
    ) {
        event.setStatus(status);
        event.setPayment(payment);
        event.setPaymentGatewayOrderId(gatewayOrderId);
        event.setPaymentGatewayPaymentId(gatewayPaymentId);
        event.setLastError(lastError);
        event.setProcessedAt(LocalDateTime.now());
        webhookEventRepository.save(event);
    }

    private String hashSha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return bytesToHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            return null;
        }
    }

    private String safeString(String value) {
        return value == null ? "" : value;
    }

    private OptionalDuplicate checkDuplicateGatewayPaymentId(String gatewayPaymentId, Long currentPaymentId) {
        if (gatewayPaymentId == null || gatewayPaymentId.isBlank()) {
            return OptionalDuplicate.noDuplicate();
        }
        return paymentRepository.findByPaymentGatewayPaymentId(gatewayPaymentId)
                .map(existing -> existing.getId().equals(currentPaymentId)
                        ? OptionalDuplicate.noDuplicate()
                        : OptionalDuplicate.duplicate())
                .orElseGet(OptionalDuplicate::noDuplicate);
    }

    public record WebhookProcessingResult(Payment payment, boolean completedNow, boolean failedNow, String event) {
    }

    private record OptionalDuplicate(boolean isDuplicate) {
        static OptionalDuplicate duplicate() {
            return new OptionalDuplicate(true);
        }

        static OptionalDuplicate noDuplicate() {
            return new OptionalDuplicate(false);
        }
    }
}
