package com.digitalcafe.controller;

import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.PaymentWebhookAckResponse;
import com.digitalcafe.payment.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments/webhook")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private final PaymentService paymentService;

    @PostMapping("/razorpay")
    public ResponseEntity<ApiResponse<PaymentWebhookAckResponse>> processRazorpayWebhook(
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
            @RequestHeader(value = "X-Razorpay-Event-Id", required = false) String eventId,
            @RequestBody String rawPayload) {
        PaymentWebhookAckResponse ack = paymentService.enqueueRazorpayWebhook(rawPayload, signature, eventId);
        return ResponseEntity.ok(ApiResponse.success("Webhook received", ack));
    }
}
