package com.digitalcafe.repository;

import com.digitalcafe.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByTransactionId(String transactionId);
    Optional<Payment> findByOrderId(Long orderId);
    @Query("SELECT p FROM Payment p JOIN FETCH p.order WHERE p.id = :paymentId")
    Optional<Payment> findByIdWithOrder(Long paymentId);

    @Query("SELECT p FROM Payment p WHERE p.order.customer.id = :customerId")
    List<Payment> findByCustomerId(Long customerId);

    @Query("SELECT p.order.customer.id FROM Payment p WHERE p.id = :paymentId")
    Optional<Long> findCustomerIdByPaymentId(Long paymentId);

    List<Payment> findByStatus(Payment.PaymentStatus status);
    
    // Dashboard queries
    List<Payment> findByStatusAndCreatedAtAfter(Payment.PaymentStatus status, java.time.LocalDateTime date);
    List<Payment> findByStatusAndCreatedAtBetween(Payment.PaymentStatus status, java.time.LocalDateTime start, java.time.LocalDateTime end);
    Page<Payment> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.order.cafe.id = :cafeId AND p.status = :status")
    BigDecimal sumAmountByCafeAndStatus(@Param("cafeId") Long cafeId, @Param("status") Payment.PaymentStatus status);
}
