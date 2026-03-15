package com.digitalcafe.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Payment entity for tracking online payments associated with orders.
 * Supports integration with Razorpay/Stripe and webhook processing.
 */
@Entity
@Table(name = "payments", indexes = {
        @Index(name = "idx_transaction_id", columnList = "transaction_id"),
        @Index(name = "idx_order_payment", columnList = "order_id"),
        @Index(name = "idx_payment_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Payment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "transaction_id", unique = true, length = 100)
    private String transactionId;

    @Column(name = "payment_gateway_order_id", length = 100, unique = true)
    private String paymentGatewayOrderId; // Razorpay/Stripe order ID

    @Column(name = "payment_gateway_payment_id", length = 100)
    private String paymentGatewayPaymentId; // Razorpay/Stripe payment ID

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 10)
    @Builder.Default
    private String currency = "INR";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 30)
    private PaymentMethod paymentMethod;

    @Column(name = "payment_gateway", length = 20)
    private String paymentGateway; // RAZORPAY, STRIPE, TEST

    @Column(name = "initiated_at")
    private LocalDateTime initiatedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "failed_at")
    private LocalDateTime failedAt;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(name = "webhook_signature", columnDefinition = "TEXT")
    private String webhookSignature;

    @Column(name = "gateway_response", columnDefinition = "TEXT")
    private String gatewayResponse; // Store full response for debugging

    public enum PaymentStatus {
        CREATED,     // Payment created locally (before gateway confirmation)
        AUTHORIZED,  // Payment authorized at gateway
        CAPTURED,    // Payment captured at gateway (final success)
        FAILED,      // Payment failed
        REFUNDED,    // Payment refunded
        PENDING,     // Legacy: Payment initiated but not completed
        PROCESSING,  // Legacy: Payment is being processed
        COMPLETED,   // Legacy: Payment successful
        CANCELLED    // Payment cancelled
    }

    public enum PaymentMethod {
        CREDIT_CARD,
        DEBIT_CARD,
        NET_BANKING,
        UPI,
        WALLET,
        OTHER
    }

    /**
     * Marks payment as completed.
     */
    public void markAsCompleted(String paymentId) {
        markAsCaptured(paymentId);
    }

    /**
     * Marks payment as failed.
     */
    public void markAsFailed(String reason) {
        this.status = PaymentStatus.FAILED;
        this.failureReason = reason;
        this.failedAt = LocalDateTime.now();
    }

    /**
     * Marks payment as authorized.
     */
    public void markAsAuthorized(String paymentId) {
        this.status = PaymentStatus.AUTHORIZED;
        if (paymentId != null && !paymentId.isBlank()) {
            this.paymentGatewayPaymentId = paymentId;
        }
    }

    /**
     * Marks payment as captured (final success).
     */
    public void markAsCaptured(String paymentId) {
        this.status = PaymentStatus.CAPTURED;
        if (paymentId != null && !paymentId.isBlank()) {
            this.paymentGatewayPaymentId = paymentId;
        }
        this.completedAt = LocalDateTime.now();
    }

    /**
     * Marks payment as refunded.
     */
    public void markAsRefunded(String reason) {
        this.status = PaymentStatus.REFUNDED;
        this.failureReason = reason;
        this.failedAt = LocalDateTime.now();
    }

    /**
     * Checks if payment is successful.
     */
    public boolean isSuccessful() {
        return status == PaymentStatus.CAPTURED || status == PaymentStatus.COMPLETED;
    }

    public boolean isCapturedOrCompleted() {
        return status == PaymentStatus.CAPTURED || status == PaymentStatus.COMPLETED;
    }
}
