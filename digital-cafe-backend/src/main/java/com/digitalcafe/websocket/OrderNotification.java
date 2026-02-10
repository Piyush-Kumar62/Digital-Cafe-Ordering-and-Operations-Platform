package com.digitalcafe.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * WebSocket notification message for order status updates.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderNotification {

    private Long orderId;
    private String orderNumber;
    private String status;
    private String message;
    private Long cafeId;
    private String cafeName;
    private LocalDateTime timestamp;
    private NotificationType type;

    public enum NotificationType {
        NEW_ORDER,      // Notify chef
        PREPARING,      // Update customer
        READY,          // Notify waiter
        SERVED,         // Update customer
        CANCELLED       // Notify all
    }
}
