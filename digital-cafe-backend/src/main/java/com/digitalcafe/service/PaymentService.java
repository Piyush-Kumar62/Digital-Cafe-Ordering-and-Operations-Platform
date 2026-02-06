package com.digitalcafe.service;

import com.digitalcafe.dto.PaymentDTO;
import com.digitalcafe.dto.PaymentRequestDTO;
import com.digitalcafe.model.Order;
import com.digitalcafe.model.Payment;
import com.digitalcafe.model.User;
import com.digitalcafe.repository.OrderRepository;
import com.digitalcafe.repository.PaymentRepository;
import com.digitalcafe.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:}")
    private String razorpayKeySecret;

    @Value("${payment.gateway:RAZORPAY}")
    private String paymentGateway;

    @Transactional
    public Map<String, Object> createPaymentOrder(Long userId, PaymentRequestDTO request) {
        // Validate order
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Validate amount
        if (order.getTotalAmount().compareTo(request.getAmount()) != 0) {
            throw new RuntimeException("Payment amount does not match order amount");
        }

        // Validate user is the customer
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!order.getCustomer().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized to pay for this order");
        }

        // Create payment record
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setBooking(order.getBooking());
        payment.setCustomer(user);
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(Payment.PaymentMethod.valueOf(request.getPaymentMethod()));
        payment.setPaymentStatus(Payment.PaymentStatus.PENDING);
        payment.setPaymentGateway(paymentGateway);

        // Generate transaction ID
        String transactionId = generateTransactionId();
        payment.setTransactionId(transactionId);

        paymentRepository.save(payment);

        // Update order status
        order.setStatus(Order.OrderStatus.CONFIRMED);
        orderRepository.save(order);

        // Create Razorpay order (in production, use actual Razorpay API)
        Map<String, Object> response = new HashMap<>();
        response.put("paymentId", payment.getId());
        response.put("orderId", order.getId());
        response.put("amount", request.getAmount());
        response.put("currency", "INR");
        response.put("transactionId", transactionId);
        response.put("razorpayKeyId", razorpayKeyId);
        
        // For testing, auto-complete payment
        if ("TEST".equals(paymentGateway)) {
            payment.setPaymentStatus(Payment.PaymentStatus.SUCCESS);
            payment.setPaymentDate(LocalDateTime.now());
            paymentRepository.save(payment);
            
            // Order remains CONFIRMED after payment, ready for preparation workflow
            orderRepository.save(order);
            
            response.put("status", "SUCCESS");
        } else {
            response.put("status", "PENDING");
        }

        return response;
    }

    @Transactional
    public PaymentDTO verifyPayment(String transactionId, String razorpaySignature) {
        Payment payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        // Verify signature (in production, use actual Razorpay signature verification)
        boolean isValid = verifyRazorpaySignature(transactionId, razorpaySignature);

        if (isValid) {
            payment.setPaymentStatus(Payment.PaymentStatus.SUCCESS);
            payment.setPaymentDate(LocalDateTime.now());
            paymentRepository.save(payment);

            // Order remains CONFIRMED after payment
            Order order = payment.getOrder();
            orderRepository.save(order);

            // Send confirmation email
            emailService.sendOrderStatusEmail(order.getCustomer().getEmail(),
                    order.getCustomer().getUsername(),
                    order.getOrderNumber(), "Payment confirmed");

            return convertToDTO(payment);
        } else {
            payment.setPaymentStatus(Payment.PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw new RuntimeException("Payment verification failed");
        }
    }

    @Transactional
    public void processRefund(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (payment.getPaymentStatus() != Payment.PaymentStatus.SUCCESS) {
            throw new RuntimeException("Cannot refund payment that is not successful");
        }

        // Process refund (in production, use actual Razorpay refund API)
        payment.setPaymentStatus(Payment.PaymentStatus.REFUNDED);
        paymentRepository.save(payment);

        // Update order status
        Order order = payment.getOrder();
        order.setStatus(Order.OrderStatus.CANCELLED);
        orderRepository.save(order);

        // Send refund email
        emailService.sendOrderStatusEmail(order.getCustomer().getEmail(),
                order.getCustomer().getUsername(),
                order.getOrderNumber(), "REFUNDED");
    }

    public PaymentDTO getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        return convertToDTO(payment);
    }

    public PaymentDTO getPaymentByTransactionId(String transactionId) {
        Payment payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        return convertToDTO(payment);
    }

    public PaymentDTO getPaymentByOrderId(Long orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order"));
        return convertToDTO(payment);
    }

    private String generateTransactionId() {
        return "TXN_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
    }

    private boolean verifyRazorpaySignature(String transactionId, String signature) {
        if ("TEST".equals(paymentGateway)) {
            return true;
        }

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            
            byte[] hash = mac.doFinal(transactionId.getBytes(StandardCharsets.UTF_8));
            String expectedSignature = Base64.getEncoder().encodeToString(hash);
            
            return expectedSignature.equals(signature);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("Error verifying payment signature", e);
        }
    }

    private PaymentDTO convertToDTO(Payment payment) {
        return PaymentDTO.builder()
                .id(payment.getId())
                .orderId(payment.getOrder() != null ? payment.getOrder().getId() : null)
                .bookingId(payment.getBooking() != null ? payment.getBooking().getId() : null)
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod().toString())
                .paymentStatus(payment.getPaymentStatus().toString())
                .transactionId(payment.getTransactionId())
                .paymentDate(payment.getPaymentDate())
                .build();
    }
}
