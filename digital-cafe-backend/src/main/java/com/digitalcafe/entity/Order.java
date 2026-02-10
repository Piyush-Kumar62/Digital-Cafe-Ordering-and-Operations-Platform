package com.digitalcafe.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Order entity representing food orders associated with bookings.
 * Tracks order status through the workflow: PLACED -> PREPARING -> READY -> SERVED
 */
@Entity
@Table(name = "orders", indexes = {
        @Index(name = "idx_order_number", columnList = "order_number"),
        @Index(name = "idx_customer_order", columnList = "customer_id"),
        @Index(name = "idx_cafe_order", columnList = "cafe_id"),
        @Index(name = "idx_order_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Order extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, unique = true, length = 20)
    private String orderNumber;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cafe_id", nullable = false)
    private Cafe cafe;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> orderItems = new ArrayList<>();

    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "tax", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal tax = BigDecimal.ZERO;

    @Column(name = "discount", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private OrderStatus status = OrderStatus.PLACED;

    @Column(name = "special_instructions", columnDefinition = "TEXT")
    private String specialInstructions;

    @Column(name = "placed_at")
    private LocalDateTime placedAt;

    @Column(name = "preparing_at")
    private LocalDateTime preparingAt;

    @Column(name = "ready_at")
    private LocalDateTime readyAt;

    @Column(name = "served_at")
    private LocalDateTime servedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preparing_by_chef_id")
    private User preparingByChef;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "served_by_waiter_id")
    private User servedByWaiter;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private Payment payment;

    public enum OrderStatus {
        PLACED,       // Order placed by customer
        PREPARING,    // Chef is preparing the food
        READY,        // Food is ready, waiter notified
        SERVED,       // Food served to customer
        CANCELLED     // Order cancelled
    }

    /**
     * Adds an order item to this order.
     */
    public void addOrderItem(OrderItem item) {
        orderItems.add(item);
        item.setOrder(this);
    }

    /**
     * Calculates and updates the total amount.
     */
    public void calculateTotal() {
        this.subtotal = orderItems.stream()
                .map(OrderItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Apply tax (e.g., 5%)
        this.tax = subtotal.multiply(new BigDecimal("0.05"));

        // Calculate final total
        this.totalAmount = subtotal.add(tax).subtract(discount != null ? discount : BigDecimal.ZERO);
    }

    /**
     * Updates order status to PREPARING.
     */
    public void markAsPreparing(User chef) {
        this.status = OrderStatus.PREPARING;
        this.preparingAt = LocalDateTime.now();
        this.preparingByChef = chef;
    }

    /**
     * Updates order status to READY.
     */
    public void markAsReady() {
        this.status = OrderStatus.READY;
        this.readyAt = LocalDateTime.now();
    }

    /**
     * Updates order status to SERVED.
     */
    public void markAsServed(User waiter) {
        this.status = OrderStatus.SERVED;
        this.servedAt = LocalDateTime.now();
        this.servedByWaiter = waiter;
    }

    /**
     * Cancels the order.
     */
    public void cancel(String reason) {
        this.status = OrderStatus.CANCELLED;
        this.cancelledAt = LocalDateTime.now();
        this.cancellationReason = reason;
    }
}
