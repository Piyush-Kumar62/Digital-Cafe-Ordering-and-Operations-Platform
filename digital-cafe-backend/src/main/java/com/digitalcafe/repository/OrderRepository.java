package com.digitalcafe.repository;

import com.digitalcafe.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNumber(String orderNumber);
    List<Order> findByCustomerId(Long customerId);
    Page<Order> findByCustomerId(Long customerId, Pageable pageable);
    List<Order> findByCafeId(Long cafeId);
    Page<Order> findByCafeId(Long cafeId, Pageable pageable);
    List<Order> findByStatus(Order.OrderStatus status);
    Page<Order> findByStatus(Order.OrderStatus status, Pageable pageable);
    List<Order> findByCafeIdAndStatus(Long cafeId, Order.OrderStatus status);
    Page<Order> findByCafeIdAndStatus(Long cafeId, Order.OrderStatus status, Pageable pageable);
    List<Order> findByBookingId(Long bookingId);
    boolean existsByBookingId(Long bookingId);

    // Orders for Chef (PLACED, CONFIRMED orders that need to be prepared)
    @Query("SELECT o FROM Order o WHERE o.cafe.id = :cafeId " +
           "AND o.status IN ('PLACED', 'CONFIRMED') " +
           "ORDER BY o.createdAt ASC")
    List<Order> findPendingOrdersForChef(Long cafeId);

    // Orders being prepared by chef
    @Query("SELECT o FROM Order o WHERE o.preparingByChef.id = :chefId " +
           "AND o.status = 'PREPARING' " +
           "ORDER BY o.preparingAt ASC")
    List<Order> findOrdersBeingPreparedByChef(Long chefId);

    // Orders ready for waiter (READY status)
    @Query("SELECT o FROM Order o WHERE o.cafe.id = :cafeId " +
           "AND o.status = 'READY' " +
           "ORDER BY o.readyAt ASC")
    List<Order> findReadyOrdersForWaiter(Long cafeId);

    // Orders served by waiter
    @Query("SELECT o FROM Order o WHERE o.servedByWaiter.id = :waiterId " +
           "ORDER BY o.servedAt DESC")
    List<Order> findOrdersServedByWaiter(Long waiterId);

    // Dashboard queries
    Long countByCafeIdAndCreatedAtBetween(Long cafeId, LocalDateTime start, LocalDateTime end);
    Long countByCafeIdAndStatusIn(Long cafeId, List<Order.OrderStatus> statuses);
    Long countByCafeIdAndStatus(Long cafeId, Order.OrderStatus status);
    Long countByCafeIdAndStatusAndCreatedAtBetween(Long cafeId, Order.OrderStatus status, LocalDateTime start, LocalDateTime end);
    List<Order> findByCafeIdAndCreatedAtBetween(Long cafeId, LocalDateTime start, LocalDateTime end);
    List<Order> findByCafeIdAndCreatedAtAfter(Long cafeId, LocalDateTime date);
    List<Order> findByCafeIdAndStatusInOrderByCreatedAtAsc(Long cafeId, List<Order.OrderStatus> statuses);
    List<Order> findByCafeIdAndStatusOrderByCreatedAtAsc(Long cafeId, Order.OrderStatus status);
}
