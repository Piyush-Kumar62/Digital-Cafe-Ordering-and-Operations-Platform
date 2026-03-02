package com.digitalcafe.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Audit trail for every order status transition.
 *
 * Design: separate entity keeps Order lean and provides a tamper-evident history log
 * that can be replayed for compliance, dispute resolution, or analytics.
 */
@Entity
@Table(name = "order_status_history", indexes = {
        @Index(name = "idx_osh_order_id", columnList = "order_id"),
        @Index(name = "idx_osh_changed_at", columnList = "changed_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", length = 20)
    private Order.OrderStatus oldStatus; // null on first creation event

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 20)
    private Order.OrderStatus newStatus;

    @Column(name = "changed_by_user_id")
    private Long changedByUserId; // null when system-triggered (e.g., payment webhook)

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;
}
