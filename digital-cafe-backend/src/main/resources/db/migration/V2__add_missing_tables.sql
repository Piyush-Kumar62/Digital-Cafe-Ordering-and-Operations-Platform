-- ================================================================================
-- V2__add_missing_tables.sql  –  Audit trail and notification persistence
-- ================================================================================
-- Adds the two new tables introduced in the production refactor:
--   1. order_status_history  – immutable audit trail of every status transition
--   2. notifications         – persisted WebSocket notifications for inbox replay
-- ================================================================================

CREATE TABLE IF NOT EXISTS order_status_history (
    id                  BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id            BIGINT       NOT NULL,
    old_status          VARCHAR(20),           -- NULL on the first PLACED record
    new_status          VARCHAR(20)  NOT NULL,
    changed_by_user_id  BIGINT,                -- NULL when system-triggered (e.g. webhook)
    changed_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    reason              TEXT,
    INDEX idx_osh_order_id   (order_id),
    INDEX idx_osh_changed_at (changed_at),
    CONSTRAINT fk_osh_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    id                    BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    recipient_user_id     BIGINT        NOT NULL,
    `type`                VARCHAR(50)   NOT NULL,  -- ORDER_PLACED, ORDER_READY, etc.
    title                 VARCHAR(100)  NOT NULL,
    message               TEXT          NOT NULL,
    reference_id          BIGINT,                  -- orderId or bookingId
    reference_type        VARCHAR(30),             -- 'ORDER' | 'BOOKING'
    websocket_destination VARCHAR(150),
    is_read               TINYINT(1)    NOT NULL DEFAULT 0,
    sent_at               DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    read_at               DATETIME(6),
    INDEX idx_notif_recipient (recipient_user_id),
    INDEX idx_notif_is_read   (is_read),
    INDEX idx_notif_sent_at   (sent_at)
);
