package com.digitalcafe.websocket;

import com.digitalcafe.dto.response.AdminProfileResponseDTO;
import com.digitalcafe.entity.Role;
import com.digitalcafe.repository.UserRepository;
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
    private final UserRepository userRepository;

    /**
     * Sends order notification to specific cafe channel.
     */
    public void sendOrderNotification(Long cafeId, OrderNotification notification) {
        try {
            String legacyDestination = "/topic/cafe/" + cafeId + "/orders";
            String canonicalDestination = "/topic/cafe/" + cafeId;
            messagingTemplate.convertAndSend(legacyDestination, notification);
            messagingTemplate.convertAndSend(canonicalDestination, notification);
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
            String canonicalDestination = "/topic/chef/" + cafeId;
            String legacyDestination = "/topic/cafe/" + cafeId + "/chef";
            messagingTemplate.convertAndSend(canonicalDestination, notification);
            messagingTemplate.convertAndSend(legacyDestination, notification);
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
            String canonicalDestination = "/topic/waiter/" + cafeId;
            String legacyDestination = "/topic/cafe/" + cafeId + "/waiter";
            messagingTemplate.convertAndSend(canonicalDestination, notification);
            messagingTemplate.convertAndSend(legacyDestination, notification);
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
            String userQueueDestination = "/user/" + customerId + "/queue/notifications";
            String customerTopicDestination = "/topic/customer/" + customerId;
            messagingTemplate.convertAndSend(userQueueDestination, notification);
            messagingTemplate.convertAndSend(customerTopicDestination, notification);
            log.info("Notified customer {}", customerId);
        } catch (Exception e) {
            log.error("Failed to notify customer", e);
        }
    }

    public void sendProfileUpdate(Long userId, AdminProfileResponseDTO payload) {
        try {
            String destination = "/topic/profile/" + userId;
            messagingTemplate.convertAndSend(destination, payload);
            log.info("Broadcasted profile update for user {}", userId);
        } catch (Exception e) {
            log.error("Failed to broadcast profile update for user {}", userId, e);
        }
    }

    public void notifyUser(Long userId, RealtimeNotification payload) {
        try {
            String destination = "/user/" + userId + "/queue/notifications";
            messagingTemplate.convertAndSend(destination, payload);
            log.info("Sent realtime notification to user {} with type {}", userId, payload.getType());
        } catch (Exception e) {
            log.error("Failed to notify user {}", userId, e);
        }
    }

    public void notifyAdmins(RealtimeNotification payload) {
        userRepository.findByRoleName(Role.RoleName.ADMIN)
                .forEach(admin -> notifyUser(admin.getId(), payload));
    }
}
