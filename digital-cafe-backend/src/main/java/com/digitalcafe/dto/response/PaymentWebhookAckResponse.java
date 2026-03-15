package com.digitalcafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Acknowledgement DTO returned to webhook callers.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentWebhookAckResponse {
    private String eventId;
    private String eventType;
    private String status;

    public static PaymentWebhookAckResponse accepted(String eventId, String eventType) {
        return PaymentWebhookAckResponse.builder()
                .eventId(eventId)
                .eventType(eventType)
                .status("ACCEPTED")
                .build();
    }

    public static PaymentWebhookAckResponse processed(String eventId, String eventType) {
        return PaymentWebhookAckResponse.builder()
                .eventId(eventId)
                .eventType(eventType)
                .status("PROCESSED")
                .build();
    }

    public static PaymentWebhookAckResponse alreadyProcessed(String eventId, String eventType) {
        return PaymentWebhookAckResponse.builder()
                .eventId(eventId)
                .eventType(eventType)
                .status("ALREADY_PROCESSED")
                .build();
    }
}
