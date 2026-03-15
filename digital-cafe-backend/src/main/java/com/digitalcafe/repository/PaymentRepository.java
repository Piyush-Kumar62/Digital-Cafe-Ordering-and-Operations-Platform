package com.digitalcafe.repository;

import com.digitalcafe.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByTransactionId(String transactionId);
    Optional<Payment> findByOrderId(Long orderId);

    /**
     * Used for payment idempotency: returns true if a payment with this Razorpay payment ID
     * has already been processed. Prevents double-activation from duplicate webhook callbacks.
     */
    boolean existsByPaymentGatewayPaymentId(String paymentGatewayPaymentId);

    /**
     * Look up a payment by the Razorpay-generated order ID (created at order initiation).
     */
    Optional<Payment> findByPaymentGatewayOrderId(String paymentGatewayOrderId);
    Optional<Payment> findByPaymentGatewayPaymentId(String paymentGatewayPaymentId);

    @Query("SELECT p FROM Payment p JOIN FETCH p.order WHERE p.id = :paymentId")
    Optional<Payment> findByIdWithOrder(Long paymentId);

    @Query("SELECT p FROM Payment p JOIN FETCH p.order o JOIN FETCH o.customer WHERE p.id = :paymentId")
    Optional<Payment> findByIdWithOrderAndCustomer(@Param("paymentId") Long paymentId);

    @Query("SELECT p FROM Payment p JOIN FETCH p.order o JOIN FETCH o.customer WHERE p.paymentGatewayOrderId = :gatewayOrderId")
    Optional<Payment> findByGatewayOrderIdWithOrderAndCustomer(@Param("gatewayOrderId") String gatewayOrderId);

    @Query("SELECT p FROM Payment p JOIN FETCH p.order WHERE p.order.customer.id = :customerId ORDER BY p.id DESC")
    List<Payment> findByCustomerId(@Param("customerId") Long customerId);

    @Query("SELECT p.order.customer.id FROM Payment p WHERE p.id = :paymentId")
    Optional<Long> findCustomerIdByPaymentId(Long paymentId);

    List<Payment> findByStatus(Payment.PaymentStatus status);
    List<Payment> findByStatusIn(Collection<Payment.PaymentStatus> statuses);
    
    // Dashboard queries
    List<Payment> findByStatusAndCreatedAtAfter(Payment.PaymentStatus status, java.time.LocalDateTime date);
    List<Payment> findByStatusAndCreatedAtBetween(Payment.PaymentStatus status, java.time.LocalDateTime start, java.time.LocalDateTime end);
    List<Payment> findByStatusInAndCreatedAtAfter(Collection<Payment.PaymentStatus> statuses, java.time.LocalDateTime date);
    List<Payment> findByStatusInAndCreatedAtBetween(Collection<Payment.PaymentStatus> statuses, java.time.LocalDateTime start, java.time.LocalDateTime end);
    Page<Payment> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.order.cafe.id = :cafeId AND p.status = :status")
    BigDecimal sumAmountByCafeAndStatus(@Param("cafeId") Long cafeId, @Param("status") Payment.PaymentStatus status);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.order.cafe.id = :cafeId AND p.status IN :statuses")
    BigDecimal sumAmountByCafeAndStatusIn(@Param("cafeId") Long cafeId, @Param("statuses") Collection<Payment.PaymentStatus> statuses);
}
