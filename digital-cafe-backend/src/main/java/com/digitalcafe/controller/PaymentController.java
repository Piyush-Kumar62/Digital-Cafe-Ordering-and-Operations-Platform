package com.digitalcafe.controller;

import com.digitalcafe.dto.PaymentDTO;
import com.digitalcafe.dto.PaymentRequestDTO;
import com.digitalcafe.service.PaymentService;
import com.digitalcafe.config.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "http://localhost:4200")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/create-order")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> createPaymentOrder(@Valid @RequestBody PaymentRequestDTO request,
                                                 HttpServletRequest httpRequest) {
        try {
            String token = extractTokenFromRequest(httpRequest);
            Long userId = jwtUtil.extractUserId(token);
            
            Map<String, Object> response = paymentService.createPaymentOrder(userId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @PostMapping("/verify")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> verifyPayment(@RequestParam String transactionId,
                                          @RequestParam String signature) {
        try {
            PaymentDTO payment = paymentService.verifyPayment(transactionId, signature);
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @PostMapping("/{paymentId}/refund")
    @PreAuthorize("hasAnyRole('ADMIN', 'CAFE_OWNER')")
    public ResponseEntity<?> processRefund(@PathVariable Long paymentId) {
        try {
            paymentService.processRefund(paymentId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Refund processed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @GetMapping("/{paymentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CAFE_OWNER', 'CUSTOMER')")
    public ResponseEntity<PaymentDTO> getPaymentById(@PathVariable Long paymentId) {
        PaymentDTO payment = paymentService.getPaymentById(paymentId);
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/transaction/{transactionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CAFE_OWNER', 'CUSTOMER')")
    public ResponseEntity<PaymentDTO> getPaymentByTransactionId(@PathVariable String transactionId) {
        PaymentDTO payment = paymentService.getPaymentByTransactionId(transactionId);
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CAFE_OWNER', 'CUSTOMER')")
    public ResponseEntity<PaymentDTO> getPaymentByOrderId(@PathVariable Long orderId) {
        PaymentDTO payment = paymentService.getPaymentByOrderId(orderId);
        return ResponseEntity.ok(payment);
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
