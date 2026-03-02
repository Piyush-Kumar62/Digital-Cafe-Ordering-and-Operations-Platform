-- ================================================================================
-- V3__database_optimizations_and_history.sql
-- Contains DB optimizations, indexes, idempotency rules, and history trailing.
-- ================================================================================

-- 1. order_status_history indexes
-- Note: Table was created in V2. Adding required composite index for fast time-series lookup.
CREATE INDEX idx_osh_order_time ON order_status_history(order_id, changed_at);

-- 2. booking_status_history
CREATE TABLE IF NOT EXISTS booking_status_history (
    id                  BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    booking_id          BIGINT       NOT NULL,
    old_status          VARCHAR(20),
    new_status          VARCHAR(20)  NOT NULL,
    changed_by_user_id  BIGINT,
    changed_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    reason              TEXT,
    CONSTRAINT fk_bsh_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_bsh_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_bsh_booking_time (booking_id, changed_at)
);

-- 3. notifications (Additive columns & index)
-- Note: V2 originally used recipient_user_id & sent_at. Adding explicitly requested names.
ALTER TABLE notifications
    ADD COLUMN user_id BIGINT AFTER recipient_user_id,
    ADD COLUMN order_id BIGINT AFTER reference_id,
    ADD COLUMN booking_id BIGINT AFTER order_id,
    ADD COLUMN created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) AFTER read_at,
    ADD CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_notif_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_notif_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

-- The user specifically requested this index for unread count lookups
CREATE INDEX idx_notif_user_read ON notifications(user_id, is_read);

-- 4. menu_categories
CREATE TABLE IF NOT EXISTS menu_categories (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    cafe_id     BIGINT       NOT NULL,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_mc_cafe FOREIGN KEY (cafe_id) REFERENCES cafes(id) ON DELETE CASCADE,
    INDEX idx_mc_cafe (cafe_id)
);

-- Add category_id to menu_items, preserving the old category string column for backwards compat
ALTER TABLE menu_items 
    ADD COLUMN category_id BIGINT AFTER category,
    ADD CONSTRAINT fk_mi_category FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE SET NULL;

-- 5. cafe_staff mapping
-- For multi-cafe assignment
CREATE TABLE IF NOT EXISTS cafe_staff (
    id         BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT      NOT NULL,
    cafe_id    BIGINT      NOT NULL,
    role_id    BIGINT      NOT NULL,
    is_active  TINYINT(1)  NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_cs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_cs_cafe FOREIGN KEY (cafe_id) REFERENCES cafes(id) ON DELETE CASCADE,
    CONSTRAINT fk_cs_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE KEY uk_staff_user_cafe_role (user_id, cafe_id, role_id)
);

-- 6. Add proper indexes
CREATE INDEX idx_bookings_cafe_date ON bookings(cafe_id, booking_date);
CREATE INDEX idx_orders_cafe_status ON orders(cafe_id, status);

-- The user requested: payments (payment_status), V1 only has index on `status`. Assuming `status` is payment_status.
-- Existing V1: INDEX idx_payment_status (status). No need to recreate.

-- 7. Payment Idempotency
-- V1 has UNIQUE on payment_gateway_payment_id and transaction_id, but NOT on payment_gateway_order_id.
ALTER TABLE payments 
    ADD CONSTRAINT uk_pay_gateway_order UNIQUE (payment_gateway_order_id);
