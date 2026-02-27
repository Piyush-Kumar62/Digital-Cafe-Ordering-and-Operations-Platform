package com.digitalcafe.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Service for sending WebSocket notifications.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Sends order notification to specific cafe channel.
     */
    public void sendOrderNotification(Long cafeId, OrderNotification notification) {
        try {
            String destination = "/topic/cafe/" + cafeId + "/orders";
            messagingTemplate.convertAndSend(destination, notification);
            log.info("Sent order notification to cafe {}: {}", cafeId, notification.getType());
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification", e);
        }
    }

    /**
     * Sends notification to chef.
     */
    public void notifyChef(Long cafeId, OrderNotification notification) {
        try {
            String destination = "/topic/cafe/" + cafeId + "/chef";
            messagingTemplate.convertAndSend(destination, notification);
            log.info("Notified chef for cafe {}", cafeId);
        } catch (Exception e) {
            log.error("Failed to notify chef", e);
        }
    }

    /**
     * Sends notification to waiter.
     */
    public void notifyWaiter(Long cafeId, OrderNotification notification) {
        try {
            String destination = "/topic/cafe/" + cafeId + "/waiter";
            messagingTemplate.convertAndSend(destination, notification);
            log.info("Notified waiter for cafe {}", cafeId);
        } catch (Exception e) {
            log.error("Failed to notify waiter", e);
        }
    }

    /**
     * Sends notification to customer.
     */
    public void notifyCustomer(Long customerId, OrderNotification notification) {
        try {
            String destination = "/queue/user/" + customerId + "/notifications";
            messagingTemplate.convertAndSend(destination, notification);
            log.info("Notified customer {}", customerId);
        } catch (Exception e) {
            log.error("Failed to notify customer", e);
        }
    }
}
