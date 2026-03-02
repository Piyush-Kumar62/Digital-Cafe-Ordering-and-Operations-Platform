package com.digitalcafe.repository;

import com.digitalcafe.entity.OrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for order status audit history.
 */
@Repository
public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, Long> {

    /**
     * Retrieves the full transition history for an order, newest-first.
     */
    List<OrderStatusHistory> findByOrderIdOrderByChangedAtDesc(Long orderId);
}
