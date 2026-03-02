package com.digitalcafe.repository;

import com.digitalcafe.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for persisted WebSocket notifications.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Retrieves all unread notifications for a user, newest-first.
     */
    List<Notification> findByUserIdAndIsReadFalseOrderBySentAtDesc(Long userId);

    /**
     * Retrieves all notifications for a user, newest-first.
     */
    List<Notification> findByUserIdOrderBySentAtDesc(Long userId);

    /**
     * Bulk-marks all unread notifications for a user as read.
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP " +
           "WHERE n.user.id = :userId AND n.isRead = false")
    int markAllAsReadForUser(@Param("userId") Long userId);

    /**
     * Count unread notifications for a user.
     */
    long countByUserIdAndIsReadFalse(Long userId);
}
