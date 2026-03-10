package com.digitalcafe.dto.response;

import com.digitalcafe.entity.PaymentWebhookEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentWebhookEventResponse {
    private Long id;
    private String provider;
    private String eventId;
    private String eventType;
    private String status;
    private Integer attemptCount;
    private Long paymentId;
    private String paymentGatewayOrderId;
    private String paymentGatewayPaymentId;
    private String signatureHash;
    private String lastError;
    private LocalDateTime processedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PaymentWebhookEventResponse fromEntity(PaymentWebhookEvent entity) {
        if (entity == null) {
            return null;
        }
        return PaymentWebhookEventResponse.builder()
                .id(entity.getId())
                .provider(entity.getProvider() != null ? entity.getProvider().name() : null)
                .eventId(entity.getEventId())
                .eventType(entity.getEventType())
                .status(entity.getStatus() != null ? entity.getStatus().name() : null)
                .attemptCount(entity.getAttemptCount())
                .paymentId(entity.getPayment() != null ? entity.getPayment().getId() : null)
                .paymentGatewayOrderId(entity.getPaymentGatewayOrderId())
                .paymentGatewayPaymentId(entity.getPaymentGatewayPaymentId())
                .signatureHash(entity.getSignatureHash())
                .lastError(entity.getLastError())
                .processedAt(entity.getProcessedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
