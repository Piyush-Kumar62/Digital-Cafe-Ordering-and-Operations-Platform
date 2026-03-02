package com.digitalcafe.service;

import com.digitalcafe.entity.Notification;
import com.digitalcafe.entity.Order;

import java.util.List;

/**
 * Service for persisting and delivering WebSocket notifications.
 *
 * Design: every push is persisted before delivery so that:
 * - Offline clients can replay their inbox on reconnect.
 * - All system communications are auditable.
 */
public interface NotificationService {

    /**
     * Persists a notification record and then pushes it to the WebSocket destination.
     *
     * @param order          the order the notification relates to
     * @param notificationType the string event name (e.g. ORDER_PLACED)
     * @param destination    the WebSocket topic path
     */
    void pushOrderEvent(Order order, String notificationType, String destination);

    /**
     * Returns all unread notifications for a user.
     */
    List<Notification> getUnreadForUser(Long userId);

    /**
     * Bulk-marks all notifications for a user as read.
     *
     * @return number of rows updated
     */
    int markAllReadForUser(Long userId);

    /**
     * Returns the count of unread notifications for a given user.
     */
    long countUnreadForUser(Long userId);
}
