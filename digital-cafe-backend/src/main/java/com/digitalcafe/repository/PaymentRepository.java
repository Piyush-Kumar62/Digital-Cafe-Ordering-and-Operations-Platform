package com.digitalcafe.repository;

import com.digitalcafe.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByTransactionId(String transactionId);
    Optional<Payment> findByOrderId(Long orderId);

    @Query("SELECT p FROM Payment p WHERE p.order.customer.id = :customerId")
    List<Payment> findByCustomerId(Long customerId);

    List<Payment> findByStatus(Payment.PaymentStatus status);
}
