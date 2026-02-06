package com.digitalcafe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, unique = true)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private TableBooking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cafe_id", nullable = false)
    private Cafe cafe;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PLACED;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false)
    private OrderType orderType;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "special_instructions", length = 1000)
    private String specialInstructions;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prepared_by")
    private User preparedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "served_by")
    private User servedBy;

    @Column(name = "order_placed_at")
    private LocalDateTime orderPlacedAt;

    @Column(name = "preparing_started_at")
    private LocalDateTime preparingStartedAt;

    @Column(name = "ready_at")
    private LocalDateTime readyAt;

    @Column(name = "served_at")
    private LocalDateTime servedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> orderItems;

    public enum OrderStatus {
        PLACED, CONFIRMED, PREPARING, READY, SERVED, COMPLETED, CANCELLED
    }

    public enum OrderType {
        PRE_ORDER, DINE_IN, TAKEAWAY
    }
}
