package com.digitalcafe.service.impl;

import com.digitalcafe.entity.Notification;
import com.digitalcafe.entity.Order;
import com.digitalcafe.entity.User;
import com.digitalcafe.repository.NotificationRepository;
import com.digitalcafe.service.NotificationService;
import com.digitalcafe.websocket.OrderNotification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

// Persistence uses REQUIRES_NEW so that a failed WebSocket push doesn't roll back the parent order transaction, and so the notification record is always saved regardless of WS broker availability.
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void pushOrderEvent(Order order, String notificationType, String destination) {
        Notification saved = persistNotification(order, notificationType, destination);

        try {
            OrderNotification wsPayload = buildWsPayload(order, notificationType);
            messagingTemplate.convertAndSend(destination, wsPayload);
            log.info("Notification pushed: notificationId={}, type={}, destination={}, orderId={}",
                    saved.getId(), notificationType, destination, order.getId());
        } catch (Exception e) {
            log.warn("WebSocket push failed (notification still persisted): notificationId={}, error={}",
                    saved.getId(), e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> getUnreadForUser(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderBySentAtDesc(userId);
    }

    @Override
    @Transactional
    public int markAllReadForUser(Long userId) {
        int updated = notificationRepository.markAllAsReadForUser(userId);
        log.info("Marked {} notifications as read for userId={}", updated, userId);
        return updated;
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnreadForUser(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }


    private Notification persistNotification(Order order, String notificationType, String destination) {
        Long recipientId = extractRecipientId(order, destination);
        User targetUser = null;
        if (recipientId != null && recipientId > 0 && destination.contains("customer")) {
            targetUser = User.builder().id(recipientId).build();
        }

        Notification notification = Notification.builder()
                .user(targetUser)
                .type(notificationType)
                .title(buildTitle(notificationType))
                .message("Order " + order.getOrderNumber() + " is now " + order.getStatus().name())
                .order(order)
                .websocketDestination(destination)
                .isRead(false)
                .sentAt(LocalDateTime.now())
                .build();
        return notificationRepository.save(notification);
    }

    private OrderNotification buildWsPayload(Order order, String notificationType) {
        return OrderNotification.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .cafeId(order.getCafe().getId())
                .cafeName(order.getCafe().getName())
                .status(order.getStatus().name())
                .type(resolveNotificationType(notificationType))
                .message("Order " + order.getOrderNumber() + " is now " + order.getStatus())
                .timestamp(LocalDateTime.now())
                .build();
    }

    private Long extractRecipientId(Order order, String destination) {
        // Derive the primary recipient userId from the destination topic
        try {
            String[] parts = destination.split("/");
            return Long.parseLong(parts[parts.length - 1]);
        } catch (NumberFormatException e) {
            return 0L; // broadcast destination — no single recipient
        }
    }

    private String buildTitle(String notificationType) {
        return switch (notificationType) {
            case "ORDER_PLACED"    -> "New Order Received";
            case "ORDER_CONFIRMED" -> "Order Confirmed";
            case "PAYMENT_CAPTURED" -> "Payment Captured";
            case "ORDER_PREPARING" -> "Order Being Prepared";
            case "ORDER_READY"     -> "Order Ready for Pickup";
            case "ORDER_SERVED"    -> "Order Served";
            case "ORDER_CANCELLED" -> "Order Cancelled";
            default                -> "Order Update";
        };
    }

    private OrderNotification.NotificationType resolveNotificationType(String notificationType) {
        return switch (notificationType) {
            case "ORDER_PLACED"    -> OrderNotification.NotificationType.NEW_ORDER;
            case "ORDER_CONFIRMED" -> OrderNotification.NotificationType.NEW_ORDER;
            case "PAYMENT_CAPTURED" -> OrderNotification.NotificationType.NEW_ORDER;
            case "ORDER_PREPARING" -> OrderNotification.NotificationType.PREPARING;
            case "ORDER_READY"     -> OrderNotification.NotificationType.READY;
            case "ORDER_SERVED"    -> OrderNotification.NotificationType.SERVED;
            default                -> OrderNotification.NotificationType.CANCELLED;
        };
    }
}
