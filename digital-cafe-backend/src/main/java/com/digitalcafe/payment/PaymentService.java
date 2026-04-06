package com.digitalcafe.payment;

import com.digitalcafe.entity.Order;
import com.digitalcafe.entity.Payment;
import com.digitalcafe.entity.PaymentWebhookEvent;
import com.digitalcafe.exception.BusinessException;
import com.digitalcafe.dto.response.PaymentWebhookAckResponse;
import com.digitalcafe.repository.PaymentRepository;
import com.digitalcafe.repository.PaymentWebhookEventRepository;
import com.digitalcafe.service.EmailService;
import com.digitalcafe.service.OrderService;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.EnumSet;
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

    @Value("${app.webhook.async.enabled:true}")
    private boolean webhookAsyncEnabled;

    private final PaymentRepository paymentRepository;
    private final PaymentWebhookEventRepository webhookEventRepository;
    private final OrderService orderService;
    private final EmailService emailService;
    private final ApplicationContext applicationContext;
    private RazorpayClient razorpayClient;

    public PaymentService(PaymentRepository paymentRepository,
                          PaymentWebhookEventRepository webhookEventRepository,
                          OrderService orderService,
                          EmailService emailService,
                          ApplicationContext applicationContext) {
        this.paymentRepository = paymentRepository;
        this.webhookEventRepository = webhookEventRepository;
        this.orderService = orderService;
        this.emailService = emailService;
        this.applicationContext = applicationContext;
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
            if (EnumSet.of(
                    Payment.PaymentStatus.CAPTURED,
                    Payment.PaymentStatus.SUCCESS,
                    Payment.PaymentStatus.COMPLETED,
                    Payment.PaymentStatus.AUTHORIZED,
                    Payment.PaymentStatus.CREATED,
                    Payment.PaymentStatus.PENDING,
                        Payment.PaymentStatus.INITIATED,
                    Payment.PaymentStatus.PROCESSING
            ).contains(existing.getStatus())) {
                if (normalizedMethod != null && existing.getPaymentMethod() != normalizedMethod) {
                    existing.setPaymentMethod(normalizedMethod);
                    return paymentRepository.save(existing);
                }
                return existing;
            }
            // FAILED/CANCELLED/REFUNDED -> reset and reuse same row (order_id is one-to-one unique).
            existing.setStatus(Payment.PaymentStatus.CREATED);
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
                .status(Payment.PaymentStatus.CREATED)
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

        if (payment.isSuccessful()) {
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

        // Mark payment as captured (final success)
        payment.markAsCaptured(paymentGatewayPaymentId);
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
    public PaymentWebhookAckResponse enqueueRazorpayWebhook(String rawPayload, String webhookSignature, String webhookEventId) {
        if (!isGateway("RAZORPAY")) {
            throw new BusinessException("Razorpay webhook is disabled because payment gateway is not RAZORPAY");
        }
        if (rawPayload == null || rawPayload.isBlank()) {
            throw new BusinessException("Webhook payload is empty");
        }

        WebhookReceiveResult receiveResult = receiveRazorpayWebhook(rawPayload, webhookSignature, webhookEventId);
        if (receiveResult.alreadyProcessed()) {
            return PaymentWebhookAckResponse.alreadyProcessed(receiveResult.eventId(), receiveResult.eventType());
        }

        if (webhookAsyncEnabled) {
            applicationContext.getBean(PaymentService.class)
                    .processRazorpayWebhookAsync(rawPayload, webhookSignature, receiveResult.eventId());
            return PaymentWebhookAckResponse.accepted(receiveResult.eventId(), receiveResult.eventType());
        }

        WebhookProcessingResult result = processRazorpayWebhookInternal(
                rawPayload, webhookSignature, receiveResult.eventId());
        return PaymentWebhookAckResponse.processed(receiveResult.eventId(), receiveResult.eventType());
    }

    @Async("webhookTaskExecutor")
    @Transactional
    public void processRazorpayWebhookAsync(String rawPayload, String webhookSignature, String webhookEventId) {
        try {
            processRazorpayWebhookInternal(rawPayload, webhookSignature, webhookEventId);
        } catch (Exception ex) {
            log.error("razorpay_webhook_async_failed event_id={} error={}",
                    safeString(webhookEventId), ex.getMessage(), ex);
        }
    }

    @Transactional
    public WebhookProcessingResult processRazorpayWebhookSync(String rawPayload, String webhookSignature, String webhookEventId) {
        return processRazorpayWebhookInternal(rawPayload, webhookSignature, webhookEventId);
    }

    private WebhookProcessingResult processRazorpayWebhookInternal(String rawPayload,
                                                                   String webhookSignature,
                                                                   String webhookEventId) {
        JSONObject root = new JSONObject(rawPayload);
        String event = root.optString("event", "");

        PaymentWebhookEvent webhookEvent = loadWebhookEventOrThrow(webhookEventId);
        if (isFinalWebhookStatus(webhookEvent.getStatus())) {
            return new WebhookProcessingResult(null, false, false, false, event);
        }

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

        WebhookPayload payload = extractWebhookPayload(root);
        if (payload == null) {
            markWebhookEvent(
                    webhookEvent,
                    PaymentWebhookEvent.ProcessingStatus.FAILED,
                    null,
                    null,
                    null,
                    "Invalid webhook payload: missing payment/refund/order entity"
            );
            throw new BusinessException("Invalid webhook payload: missing payment/refund/order entity");
        }

        webhookEvent.setEventType(event);
        webhookEvent.setSignatureHash(hashSha256(safeString(webhookSignature)));
        webhookEvent.setPayload(rawPayload);

        Payment payment = resolvePaymentForWebhook(payload);
        if (payment == null) {
            markWebhookEvent(
                    webhookEvent,
                    PaymentWebhookEvent.ProcessingStatus.FAILED,
                    null,
                    payload.gatewayOrderId(),
                    payload.gatewayPaymentId(),
                    "Payment not found for gateway identifiers"
            );
            throw new BusinessException("Payment not found for gateway identifiers");
        }

        payment.setWebhookSignature(webhookSignature);
        payment.setGatewayResponse(rawPayload);

        boolean capturedNow = false;
        boolean refundedNow = false;
        boolean failedNow = false;

        if ("payment.authorized".equalsIgnoreCase(event)) {
            if (!payment.isCapturedOrCompleted() && payment.getStatus() != Payment.PaymentStatus.AUTHORIZED) {
                payment.markAsAuthorized(payload.gatewayPaymentId());
            }
            applyMethodFromPayload(payment, payload);
            paymentRepository.save(payment);
            markWebhookEvent(webhookEvent, PaymentWebhookEvent.ProcessingStatus.PROCESSED, payment,
                    payload.gatewayOrderId(), payload.gatewayPaymentId(), null);
            logWebhookProcessed(event, webhookEventId, payment);
            return new WebhookProcessingResult(payment, capturedNow, failedNow, refundedNow, event);
        }

        if ("payment.captured".equalsIgnoreCase(event) || "order.paid".equalsIgnoreCase(event)) {
            OptionalDuplicate duplicate = checkDuplicateGatewayPaymentId(payload.gatewayPaymentId(), payment.getId());
            if (duplicate.isDuplicate()) {
                markWebhookEvent(
                        webhookEvent,
                        PaymentWebhookEvent.ProcessingStatus.IGNORED,
                        payment,
                        payload.gatewayOrderId(),
                        payload.gatewayPaymentId(),
                        "Duplicate gateway payment ID delivery"
                );
                logWebhookProcessed(event, webhookEventId, payment);
                return new WebhookProcessingResult(payment, false, false, false, event);
            }

            if (!payment.isCapturedOrCompleted()) {
                payment.markAsCaptured(payload.gatewayPaymentId());
                capturedNow = true;
            } else if (payload.gatewayPaymentId() != null && !payload.gatewayPaymentId().isBlank()) {
                payment.setPaymentGatewayPaymentId(payload.gatewayPaymentId());
            }

            applyMethodFromPayload(payment, payload);
            payment.setFailureReason(null);
            payment.setFailedAt(null);
            paymentRepository.save(payment);

            markWebhookEvent(
                    webhookEvent,
                    PaymentWebhookEvent.ProcessingStatus.PROCESSED,
                    payment,
                    payload.gatewayOrderId(),
                    payload.gatewayPaymentId(),
                    null
            );

            if (capturedNow) {
                orderService.activateOrderAfterPayment(payment.getOrder().getId());
                sendPaymentReceiptEmail(payment);
            }

            logWebhookProcessed(event, webhookEventId, payment);
            return new WebhookProcessingResult(payment, capturedNow, false, false, event);
        }

        if ("payment.failed".equalsIgnoreCase(event)) {
            if (!payment.isCapturedOrCompleted() && payment.getStatus() != Payment.PaymentStatus.REFUNDED) {
                String reason = payload.errorDescription() != null
                        ? payload.errorDescription()
                        : "Payment failed on Razorpay";
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
                    payload.gatewayOrderId(),
                    payload.gatewayPaymentId(),
                    null
            );
            logWebhookProcessed(event, webhookEventId, payment);
            return new WebhookProcessingResult(payment, false, failedNow, false, event);
        }

        if ("refund.created".equalsIgnoreCase(event) || "refund.processed".equalsIgnoreCase(event)) {
            if (payment.getStatus() != Payment.PaymentStatus.REFUNDED) {
                payment.markAsRefunded("Refund " + event.replace("refund.", "") + " on Razorpay");
                paymentRepository.save(payment);
                refundedNow = true;
            } else {
                paymentRepository.save(payment);
            }
            markWebhookEvent(
                    webhookEvent,
                    PaymentWebhookEvent.ProcessingStatus.PROCESSED,
                    payment,
                    payload.gatewayOrderId(),
                    payload.gatewayPaymentId(),
                    null
            );
            logWebhookProcessed(event, webhookEventId, payment);
            return new WebhookProcessingResult(payment, false, false, refundedNow, event);
        }

        paymentRepository.save(payment);
        markWebhookEvent(
                webhookEvent,
                PaymentWebhookEvent.ProcessingStatus.IGNORED,
                payment,
                payload.gatewayOrderId(),
                payload.gatewayPaymentId(),
                "Unsupported webhook event: " + event
        );
        logWebhookProcessed(event, webhookEventId, payment);
        return new WebhookProcessingResult(payment, false, false, false, event);
    }

    private WebhookReceiveResult receiveRazorpayWebhook(String rawPayload, String webhookSignature, String webhookEventId) {
        JSONObject root = new JSONObject(rawPayload);
        String eventType = root.optString("event", "");
        String normalizedEventId = normalizeEventId(webhookEventId);

        Optional<PaymentWebhookEvent> existingOpt =
                webhookEventRepository.findByProviderAndEventId(PaymentWebhookEvent.Provider.RAZORPAY, normalizedEventId);
        if (existingOpt.isPresent() && isFinalWebhookStatus(existingOpt.get().getStatus())) {
            return WebhookReceiveResult.alreadyProcessed(normalizedEventId,
                    existingOpt.get().getEventType() != null ? existingOpt.get().getEventType() : eventType);
        }

        PaymentWebhookEvent event = existingOpt.orElseGet(() -> PaymentWebhookEvent.builder()
                .provider(PaymentWebhookEvent.Provider.RAZORPAY)
                .eventId(normalizedEventId)
                .attemptCount(0)
                .build());

        event.setEventType(eventType);
        event.setSignatureHash(hashSha256(safeString(webhookSignature)));
        event.setPayload(rawPayload);
        event.setStatus(PaymentWebhookEvent.ProcessingStatus.RECEIVED);
        event.setLastError(null);
        event.setAttemptCount((event.getAttemptCount() == null ? 0 : event.getAttemptCount()) + 1);
        event.setProcessedAt(null);

        webhookEventRepository.save(event);
        log.info("razorpay_webhook_received event_id={} event_type={}", normalizedEventId, eventType);
        return WebhookReceiveResult.received(normalizedEventId, eventType);
    }

    private String normalizeEventId(String webhookEventId) {
        return (webhookEventId == null || webhookEventId.isBlank())
                ? "AUTO-" + UUID.randomUUID()
                : webhookEventId.trim();
    }

    private PaymentWebhookEvent loadWebhookEventOrThrow(String eventId) {
        return webhookEventRepository.findByProviderAndEventId(PaymentWebhookEvent.Provider.RAZORPAY, eventId)
                .orElseThrow(() -> new BusinessException("Webhook event not found for id: " + eventId));
    }

    private boolean isFinalWebhookStatus(PaymentWebhookEvent.ProcessingStatus status) {
        return status == PaymentWebhookEvent.ProcessingStatus.PROCESSED
                || status == PaymentWebhookEvent.ProcessingStatus.IGNORED
                || status == PaymentWebhookEvent.ProcessingStatus.SIGNATURE_INVALID;
    }

    private WebhookPayload extractWebhookPayload(JSONObject root) {
        JSONObject payload = root.optJSONObject("payload");
        if (payload == null) {
            return null;
        }

        JSONObject paymentEntity = payload.optJSONObject("payment") != null
                ? payload.optJSONObject("payment").optJSONObject("entity")
                : null;
        JSONObject refundEntity = payload.optJSONObject("refund") != null
                ? payload.optJSONObject("refund").optJSONObject("entity")
                : null;
        JSONObject orderEntity = payload.optJSONObject("order") != null
                ? payload.optJSONObject("order").optJSONObject("entity")
                : null;

        String gatewayOrderId = null;
        String gatewayPaymentId = null;
        String method = null;
        String errorDescription = null;

        if (paymentEntity != null) {
            gatewayOrderId = paymentEntity.optString("order_id", null);
            gatewayPaymentId = paymentEntity.optString("id", null);
            method = paymentEntity.optString("method", null);
            errorDescription = paymentEntity.optString("error_description", null);
        }
        if (orderEntity != null && (gatewayOrderId == null || gatewayOrderId.isBlank())) {
            gatewayOrderId = orderEntity.optString("id", null);
        }
        if (refundEntity != null) {
            if (gatewayPaymentId == null || gatewayPaymentId.isBlank()) {
                gatewayPaymentId = refundEntity.optString("payment_id", null);
            }
            if (gatewayOrderId == null || gatewayOrderId.isBlank()) {
                gatewayOrderId = refundEntity.optString("order_id", null);
            }
        }

        if ((gatewayOrderId == null || gatewayOrderId.isBlank())
                && (gatewayPaymentId == null || gatewayPaymentId.isBlank())) {
            return null;
        }
        return new WebhookPayload(gatewayOrderId, gatewayPaymentId, method, errorDescription);
    }

    private Payment resolvePaymentForWebhook(WebhookPayload payload) {
        if (payload.gatewayOrderId() != null && !payload.gatewayOrderId().isBlank()) {
            return paymentRepository.findByGatewayOrderIdWithOrderAndCustomer(payload.gatewayOrderId())
                    .orElse(null);
        }
        if (payload.gatewayPaymentId() != null && !payload.gatewayPaymentId().isBlank()) {
            return paymentRepository.findByPaymentGatewayPaymentId(payload.gatewayPaymentId())
                    .orElse(null);
        }
        return null;
    }

    private void applyMethodFromPayload(Payment payment, WebhookPayload payload) {
        if (payload.method() == null || payload.method().isBlank()) {
            return;
        }
        Payment.PaymentMethod webhookMethod = normalizePaymentMethod(payload.method());
        if (webhookMethod != null) {
            payment.setPaymentMethod(webhookMethod);
        }
    }

    private void logWebhookProcessed(String event, String eventId, Payment payment) {
        Long orderId = payment != null && payment.getOrder() != null ? payment.getOrder().getId() : null;
        log.info("razorpay_webhook_processed event_id={} event={} payment_id={} order_id={}",
                safeString(eventId), safeString(event),
                payment != null ? payment.getId() : null,
                orderId);
    }

    private void sendPaymentReceiptEmail(Payment payment) {
        if (payment == null || payment.getOrder() == null || payment.getOrder().getCustomer() == null) {
            return;
        }
        String customerEmail = payment.getOrder().getCustomer().getEmail();
        if (customerEmail == null || customerEmail.isBlank()) {
            return;
        }
        Order order = payment.getOrder();
        var orderResponse = orderService.getOrderById(order.getId());
        String customerName = orderResponse.getCustomerName() != null && !orderResponse.getCustomerName().isBlank()
                ? orderResponse.getCustomerName()
                : "Customer";
        String receiptNumber = payment.getTransactionId() != null && !payment.getTransactionId().isBlank()
                ? payment.getTransactionId()
                : "RCPT-" + payment.getId();
        String details = buildPaymentDetails(payment, orderResponse, resolveGatewayLabel(payment));
        emailService.sendPaymentReceipt(customerEmail, customerName, receiptNumber, details);
    }

    private String resolveGatewayLabel(Payment payment) {
        if (payment.getPaymentGateway() == null || payment.getPaymentGateway().isBlank()) {
            return "-";
        }
        return payment.getPaymentGateway().trim().toUpperCase();
    }

    private String buildPaymentDetails(Payment payment, com.digitalcafe.dto.response.OrderResponse order, String gatewayLabel) {
        String completedAt = order.getPlacedAt() != null
                ? order.getPlacedAt().toString()
                : LocalDateTime.now().toString();
        String method = payment.getPaymentMethod() != null ? payment.getPaymentMethod().name().replace('_', ' ') : "-";
        BigDecimal subtotal = order.getSubtotal() != null ? order.getSubtotal() : safeAmount(payment.getAmount());
        BigDecimal discount = order.getDiscount() != null ? order.getDiscount() : BigDecimal.ZERO;
        BigDecimal tax = order.getTax() != null ? order.getTax() : BigDecimal.ZERO;
        BigDecimal fee = BigDecimal.ZERO;
        BigDecimal rounding = BigDecimal.ZERO;
        BigDecimal netPayable = subtotal.subtract(discount).add(tax).add(fee).add(rounding);

        String itemLines = "-";
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            itemLines = order.getItems().stream()
                    .map(i -> String.format(
                            "%s||%s||INR %s||INR %s||HSN:-||Notes:-",
                            safeString(i.getMenuItemName()),
                            i.getQuantity() != null ? i.getQuantity() : 1,
                            i.getUnitPrice() != null ? i.getUnitPrice().toPlainString() : "0.00",
                            i.getTotalPrice() != null ? i.getTotalPrice().toPlainString() : "0.00"
                    ))
                    .reduce((a, b) -> a + "; " + b)
                    .orElse("-");
        }

        return String.format(
                "Invoice Type: %s%nOrder: %s%nCafe: %s%nCafe Legal Name: %s%nCafe GSTIN: %s%nCafe Address: %s%nCafe Contact: %s%nAmount Paid: %s %s%nSubtotal: %s %s%nDiscount: %s %s%nTax: %s %s%nCGST: %s %s%nSGST: %s %s%nIGST: %s %s%nPlatform / Service Fee: %s %s%nRounding: %s %s%nNet Payable: %s %s%nStatus: %s%nMethod: %s%nPayment Instrument: %s%nGateway: %s%nGateway Order ID: %s%nGateway Payment ID: %s%nPayment Time: %s%nIssue Time: %s%nGenerated At: %s%nTimezone: %s%nBooking: %s%nOrder Channel: %s%nServed By: %s%nCashier: %s%nItems: %s",
                "Tax Invoice",
                safeString(order.getOrderNumber()),
                safeString(order.getCafeName()),
                safeString(order.getCafeName()),
                "-",
                "-",
                "-",
                safeString(payment.getCurrency()),
                payment.getAmount() != null ? payment.getAmount().toPlainString() : "0.00",
                safeString(payment.getCurrency()),
                subtotal != null ? subtotal.toPlainString() : "0.00",
                safeString(payment.getCurrency()),
                discount.toPlainString(),
                safeString(payment.getCurrency()),
                tax.toPlainString(),
                safeString(payment.getCurrency()),
                tax.divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP).toPlainString(),
                safeString(payment.getCurrency()),
                tax.divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP).toPlainString(),
                safeString(payment.getCurrency()),
                "0.00",
                safeString(payment.getCurrency()),
                fee.toPlainString(),
                safeString(payment.getCurrency()),
                rounding.toPlainString(),
                safeString(payment.getCurrency()),
                netPayable.toPlainString(),
                safeString(payment.getStatus() != null ? payment.getStatus().name() : null),
                method,
                method,
                safeString(gatewayLabel),
                safeString(payment.getPaymentGatewayOrderId()),
                safeString(payment.getPaymentGatewayPaymentId()),
                safeString(completedAt),
                safeString(completedAt),
                LocalDateTime.now().toString(),
                ZoneId.systemDefault().toString(),
                safeString(order.getBookingNumber()),
                "WEB",
                safeString(order.getServedByWaiterName()),
                safeString(order.getServedByWaiterName()),
                itemLines
        );
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

    private BigDecimal safeAmount(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
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

    public record WebhookProcessingResult(
            Payment payment,
            boolean capturedNow,
            boolean failedNow,
            boolean refundedNow,
            String event
    ) {
    }

    private record WebhookReceiveResult(String eventId, String eventType, boolean alreadyProcessed) {
        static WebhookReceiveResult received(String eventId, String eventType) {
            return new WebhookReceiveResult(eventId, eventType, false);
        }

        static WebhookReceiveResult alreadyProcessed(String eventId, String eventType) {
            return new WebhookReceiveResult(eventId, eventType, true);
        }
    }

    private record WebhookPayload(String gatewayOrderId, String gatewayPaymentId, String method, String errorDescription) {
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
