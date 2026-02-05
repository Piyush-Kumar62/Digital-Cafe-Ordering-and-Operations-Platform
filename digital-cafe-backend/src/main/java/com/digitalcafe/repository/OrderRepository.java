package com.digitalcafe.repository;

import com.digitalcafe.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNumber(String orderNumber);
    List<Order> findByCustomerId(Long customerId);
    List<Order> findByCafeId(Long cafeId);
    List<Order> findByStatus(Order.OrderStatus status);
    List<Order> findByCafeIdAndStatus(Long cafeId, Order.OrderStatus status);
    List<Order> findByBookingId(Long bookingId);

    // Orders for Chef (PLACED, CONFIRMED orders that need to be prepared)
    @Query("SELECT o FROM Order o WHERE o.cafe.id = :cafeId " +
           "AND o.status IN ('PLACED', 'CONFIRMED') " +
           "ORDER BY o.createdAt ASC")
    List<Order> findPendingOrdersForChef(Long cafeId);

    // Orders being prepared by chef
    @Query("SELECT o FROM Order o WHERE o.preparedBy.id = :chefId " +
           "AND o.status = 'PREPARING' " +
           "ORDER BY o.preparingStartedAt ASC")
    List<Order> findOrdersBeingPreparedByChef(Long chefId);

    // Orders ready for waiter (READY status)
    @Query("SELECT o FROM Order o WHERE o.cafe.id = :cafeId " +
           "AND o.status = 'READY' " +
           "ORDER BY o.readyAt ASC")
    List<Order> findReadyOrdersForWaiter(Long cafeId);

    // Orders served by waiter
    @Query("SELECT o FROM Order o WHERE o.servedBy.id = :waiterId " +
           "ORDER BY o.servedAt DESC")
    List<Order> findOrdersServedByWaiter(Long waiterId);
}
