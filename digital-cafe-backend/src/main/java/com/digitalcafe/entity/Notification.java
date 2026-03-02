package com.digitalcafe.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Persisted record of every WebSocket notification sent through the system.
 *
 * Design: WebSocket is fire-and-forget. If the client is offline, the push is lost.
 * Persisting notifications enables:
 *  - Inbox replay on reconnect
 *  - Read/unread tracking
 *  - Audit logging of system communications
 */
@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notif_user_read", columnList = "user_id, is_read"),
        @Index(name = "idx_notif_sent_at",   columnList = "sent_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "type", nullable = false, length = 50)
    private String type; // e.g. ORDER_PLACED, ORDER_READY, ORDER_CANCELLED

    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @Column(name = "websocket_destination", length = 150)
    private String websocketDestination; // the topic path the message was pushed to

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
