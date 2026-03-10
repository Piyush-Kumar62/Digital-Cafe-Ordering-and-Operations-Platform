package com.digitalcafe.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "payment_webhook_events",
        indexes = {
                @Index(name = "idx_webhook_provider_event", columnList = "provider,event_id"),
                @Index(name = "idx_webhook_status", columnList = "status"),
                @Index(name = "idx_webhook_payment", columnList = "payment_id")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_webhook_provider_event_id", columnNames = {"provider", "event_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class PaymentWebhookEvent extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 20)
    private Provider provider;

    @Column(name = "event_id", length = 120)
    private String eventId;

    @Column(name = "event_type", length = 80)
    private String eventType;

    @Column(name = "signature_hash", length = 128)
    private String signatureHash;

    @Column(name = "payment_gateway_order_id", length = 120)
    private String paymentGatewayOrderId;

    @Column(name = "payment_gateway_payment_id", length = 120)
    private String paymentGatewayPaymentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    private Payment payment;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private ProcessingStatus status;

    @Column(name = "attempt_count", nullable = false)
    @Builder.Default
    private Integer attemptCount = 1;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    @Column(name = "payload", columnDefinition = "LONGTEXT")
    private String payload;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    public enum Provider {
        RAZORPAY
    }

    public enum ProcessingStatus {
        RECEIVED,
        PROCESSED,
        IGNORED,
        SIGNATURE_INVALID,
        FAILED
    }
}
