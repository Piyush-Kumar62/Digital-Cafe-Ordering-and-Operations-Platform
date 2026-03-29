package com.digitalcafe.controller;

import com.digitalcafe.dto.response.PaymentWebhookAckResponse;
import com.digitalcafe.payment.PaymentService;
import com.digitalcafe.security.ProfileCompletionFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PaymentWebhookController.class)
@AutoConfigureMockMvc(addFilters = false)
class PaymentWebhookControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PaymentService paymentService;

    @MockitoBean
    private com.digitalcafe.security.JwtUtil jwtUtil;

    @MockitoBean
    private com.digitalcafe.security.CustomUserDetailsService customUserDetailsService;

    @MockitoBean
    private com.digitalcafe.repository.UserRepository userRepository;

    @MockitoBean
    private ProfileCompletionFilter profileCompletionFilter;

    @Test
    void webhookEndpoint_returnsAck() throws Exception {
        when(paymentService.enqueueRazorpayWebhook(anyString(), anyString(), anyString()))
                .thenReturn(PaymentWebhookAckResponse.accepted("evt_100", "payment.captured"));

        mockMvc.perform(post("/api/v1/payments/webhook/razorpay")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Razorpay-Event-Id", "evt_100")
                        .header("X-Razorpay-Signature", "sig")
                        .content("{\"event\":\"payment.captured\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.eventId").value("evt_100"))
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"));
    }
}

