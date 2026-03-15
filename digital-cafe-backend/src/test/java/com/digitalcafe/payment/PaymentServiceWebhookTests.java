package com.digitalcafe.payment;

import com.digitalcafe.dto.response.OrderResponse;
import com.digitalcafe.entity.Order;
import com.digitalcafe.entity.Payment;
import com.digitalcafe.entity.PaymentWebhookEvent;
import com.digitalcafe.entity.User;
import com.digitalcafe.repository.PaymentRepository;
import com.digitalcafe.repository.PaymentWebhookEventRepository;
import com.digitalcafe.service.EmailService;
import com.digitalcafe.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.context.ApplicationContext;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceWebhookTests {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentWebhookEventRepository webhookEventRepository;

    @Mock
    private OrderService orderService;

    @Mock
    private EmailService emailService;

    @Mock
    private ApplicationContext applicationContext;

    @InjectMocks
    private PaymentService paymentService;

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(paymentService, "paymentGateway", "RAZORPAY");
        ReflectionTestUtils.setField(paymentService, "razorpayWebhookSecret", "test_secret");
        ReflectionTestUtils.setField(paymentService, "webhookAsyncEnabled", false);
    }

    @Test
    void paymentCaptured_marksCaptured_andActivatesOrder() throws Exception {
        String payload = """
                {"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_123","order_id":"order_123","method":"upi"}}}}
                """;
        String signature = sign(payload, "test_secret");

        Order order = new Order();
        order.setId(42L);
        order.setOrderNumber("ORD-42");
        User customer = new User();
        customer.setEmail("customer@test.com");
        order.setCustomer(customer);

        Payment payment = new Payment();
        payment.setId(100L);
        payment.setOrder(order);
        payment.setStatus(Payment.PaymentStatus.CREATED);

        PaymentWebhookEvent event = PaymentWebhookEvent.builder()
                .id(1L)
                .provider(PaymentWebhookEvent.Provider.RAZORPAY)
                .eventId("evt_1")
                .status(PaymentWebhookEvent.ProcessingStatus.RECEIVED)
                .attemptCount(1)
                .build();

        when(webhookEventRepository.findByProviderAndEventId(
                PaymentWebhookEvent.Provider.RAZORPAY, "evt_1"))
                .thenReturn(Optional.of(event));
        when(webhookEventRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        when(paymentRepository.findByGatewayOrderIdWithOrderAndCustomer("order_123"))
                .thenReturn(Optional.of(payment));
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        when(orderService.getOrderById(42L)).thenReturn(OrderResponse.builder()
                .id(42L)
                .orderNumber("ORD-42")
                .cafeName("Cafe")
                .bookingNumber("BK-1")
                .placedAt(LocalDateTime.now())
                .build());

        PaymentService.WebhookProcessingResult result =
                paymentService.processRazorpayWebhookSync(payload, signature, "evt_1");

        assertThat(result.capturedNow()).isTrue();
        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.CAPTURED);
        verify(orderService).activateOrderAfterPayment(42L);
        verify(emailService).sendPaymentReceipt(eq("customer@test.com"), any(), any(), any());
    }

    @Test
    void paymentAuthorized_marksAuthorized_withoutOrderActivation() throws Exception {
        String payload = """
                {"event":"payment.authorized","payload":{"payment":{"entity":{"id":"pay_456","order_id":"order_456","method":"card"}}}}
                """;
        String signature = sign(payload, "test_secret");

        Order order = new Order();
        order.setId(50L);
        User customer = new User();
        customer.setEmail("customer2@test.com");
        order.setCustomer(customer);

        Payment payment = new Payment();
        payment.setId(200L);
        payment.setOrder(order);
        payment.setStatus(Payment.PaymentStatus.CREATED);

        PaymentWebhookEvent event = PaymentWebhookEvent.builder()
                .id(2L)
                .provider(PaymentWebhookEvent.Provider.RAZORPAY)
                .eventId("evt_2")
                .status(PaymentWebhookEvent.ProcessingStatus.RECEIVED)
                .attemptCount(1)
                .build();

        when(webhookEventRepository.findByProviderAndEventId(
                PaymentWebhookEvent.Provider.RAZORPAY, "evt_2"))
                .thenReturn(Optional.of(event));
        when(webhookEventRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        when(paymentRepository.findByGatewayOrderIdWithOrderAndCustomer("order_456"))
                .thenReturn(Optional.of(payment));
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PaymentService.WebhookProcessingResult result =
                paymentService.processRazorpayWebhookSync(payload, signature, "evt_2");

        assertThat(result.capturedNow()).isFalse();
        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.AUTHORIZED);
        verify(orderService, never()).activateOrderAfterPayment(any());
    }

    @Test
    void alreadyProcessedEvent_returnsAck_withoutProcessing() {
        PaymentWebhookEvent event = PaymentWebhookEvent.builder()
                .id(3L)
                .provider(PaymentWebhookEvent.Provider.RAZORPAY)
                .eventId("evt_3")
                .eventType("payment.captured")
                .status(PaymentWebhookEvent.ProcessingStatus.PROCESSED)
                .attemptCount(1)
                .build();

        when(webhookEventRepository.findByProviderAndEventId(
                PaymentWebhookEvent.Provider.RAZORPAY, "evt_3"))
                .thenReturn(Optional.of(event));

        var ack = paymentService.enqueueRazorpayWebhook("{\"event\":\"payment.captured\"}", "sig", "evt_3");

        assertThat(ack.getStatus()).isEqualTo("ALREADY_PROCESSED");
        verify(webhookEventRepository, never()).save(any());
        verifyNoInteractions(paymentRepository);
    }

    private String sign(String payload, String secret) throws Exception {
        Mac sha256Hmac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256Hmac.init(secretKey);
        byte[] hash = sha256Hmac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        return bytesToHex(hash);
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
