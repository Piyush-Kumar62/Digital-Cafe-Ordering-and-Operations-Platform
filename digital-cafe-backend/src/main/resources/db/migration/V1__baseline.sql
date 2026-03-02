-- ================================================================================
-- V1__baseline.sql  –  Initial schema baseline for Digital Café Platform
-- ================================================================================
-- Applied by Flyway on first deployment. This mirrors the tables JPA would create
-- via ddl-auto=create, allowing us to disable ddl-auto in production.
-- ================================================================================

-- Roles
CREATE TABLE IF NOT EXISTS roles (
    id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(30)  NOT NULL UNIQUE,
    created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id                            BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username                      VARCHAR(50)   NOT NULL UNIQUE,
    email                         VARCHAR(100)  NOT NULL UNIQUE,
    `password`                    VARCHAR(255)  NOT NULL,
    is_active                     TINYINT(1)    NOT NULL DEFAULT 1,
    is_email_verified             TINYINT(1)    NOT NULL DEFAULT 0,
    is_profile_complete           TINYINT(1)    NOT NULL DEFAULT 0,
    must_reset_password           TINYINT(1)    NOT NULL DEFAULT 0,
    is_temp_password              TINYINT(1)    NOT NULL DEFAULT 0,
    registration_status           VARCHAR(30)   NOT NULL DEFAULT 'APPROVED',
    profile_completion_percentage INT           NOT NULL DEFAULT 0,
    last_login                    DATETIME(6),
    cafe_id                       BIGINT,
    created_by_user_id            BIGINT,
    joining_date                  DATE,
    experience_years              INT,
    shift                         VARCHAR(30),
    govt_id_type                  VARCHAR(50),
    govt_id_number                VARCHAR(50),
    created_at                    DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at                    DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_user_email  (email),
    INDEX idx_user_status (registration_status)
);

-- User ↔ Role join
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Cafes
CREATE TABLE IF NOT EXISTS cafes (
    id          BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    description TEXT,
    address     VARCHAR(255),
    city        VARCHAR(100),
    state       VARCHAR(100),
    pincode     VARCHAR(10),
    phone       VARCHAR(20),
    email       VARCHAR(100),
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    owner_id    BIGINT,
    created_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_cafe_active (is_active)
);

-- Cafe Tables
CREATE TABLE IF NOT EXISTS cafe_tables (
    id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    cafe_id      BIGINT       NOT NULL,
    table_number VARCHAR(10)  NOT NULL,
    capacity     INT          NOT NULL,
    is_available TINYINT(1)   NOT NULL DEFAULT 1,
    created_at   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE  KEY uk_table_cafe_number (cafe_id, table_number),
    CONSTRAINT fk_ct_cafe FOREIGN KEY (cafe_id) REFERENCES cafes(id) ON DELETE CASCADE
);

-- Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
    id           BIGINT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
    cafe_id      BIGINT         NOT NULL,
    name         VARCHAR(100)   NOT NULL,
    description  TEXT,
    price        DECIMAL(10,2)  NOT NULL,
    category     VARCHAR(50),
    is_available TINYINT(1)     NOT NULL DEFAULT 1,
    image_url    VARCHAR(255),
    created_at   DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at   DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_menu_cafe     (cafe_id),
    INDEX idx_menu_category (category),
    CONSTRAINT fk_mi_cafe FOREIGN KEY (cafe_id) REFERENCES cafes(id) ON DELETE CASCADE
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id                  BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    booking_number      VARCHAR(20)  NOT NULL UNIQUE,
    customer_id         BIGINT       NOT NULL,
    cafe_id             BIGINT       NOT NULL,
    table_id            BIGINT       NOT NULL,
    booking_date        DATE         NOT NULL,
    booking_time        TIME         NOT NULL,
    start_time          TIME,
    end_time            TIME,
    number_of_guests    INT          NOT NULL,
    status              VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    special_requests    TEXT,
    cancelled_at        DATETIME(6),
    cancellation_reason TEXT,
    created_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE  KEY uk_booking_table_date_time (table_id, booking_date, booking_time),
    INDEX idx_customer_booking     (customer_id),
    INDEX idx_cafe_booking         (cafe_id),
    INDEX idx_table_booking        (table_id),
    INDEX idx_booking_date         (booking_date),
    INDEX idx_booking_date_time    (booking_date, booking_time),
    INDEX idx_booking_date_start   (booking_date, start_time),
    CONSTRAINT fk_bk_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_bk_cafe     FOREIGN KEY (cafe_id)     REFERENCES cafes(id),
    CONSTRAINT fk_bk_table    FOREIGN KEY (table_id)    REFERENCES cafe_tables(id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id                    BIGINT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_number          VARCHAR(20)    NOT NULL UNIQUE,
    booking_id            BIGINT         NOT NULL UNIQUE,
    customer_id           BIGINT         NOT NULL,
    cafe_id               BIGINT         NOT NULL,
    subtotal              DECIMAL(10,2)  NOT NULL,
    tax                   DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    discount              DECIMAL(10,2)           DEFAULT 0.00,
    total_amount          DECIMAL(10,2)  NOT NULL,
    status                VARCHAR(20)    NOT NULL DEFAULT 'PLACED',
    special_instructions  TEXT,
    placed_at             DATETIME(6),
    preparing_at          DATETIME(6),
    ready_at              DATETIME(6),
    served_at             DATETIME(6),
    cancelled_at          DATETIME(6),
    cancellation_reason   TEXT,
    preparing_by_chef_id  BIGINT,
    served_by_waiter_id   BIGINT,
    created_at            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at            DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_order_number   (order_number),
    INDEX idx_customer_order (customer_id),
    INDEX idx_cafe_order     (cafe_id),
    INDEX idx_order_status   (status),
    CONSTRAINT fk_ord_booking  FOREIGN KEY (booking_id)           REFERENCES bookings(id),
    CONSTRAINT fk_ord_customer FOREIGN KEY (customer_id)          REFERENCES users(id),
    CONSTRAINT fk_ord_cafe     FOREIGN KEY (cafe_id)              REFERENCES cafes(id),
    CONSTRAINT fk_ord_chef     FOREIGN KEY (preparing_by_chef_id) REFERENCES users(id),
    CONSTRAINT fk_ord_waiter   FOREIGN KEY (served_by_waiter_id)  REFERENCES users(id)
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id                   BIGINT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id             BIGINT         NOT NULL,
    menu_item_id         BIGINT         NOT NULL,
    quantity             INT            NOT NULL,
    unit_price           DECIMAL(10,2)  NOT NULL,
    total_price          DECIMAL(10,2)  NOT NULL,
    special_instructions TEXT,
    created_at           DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at           DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_oi_order (order_id),
    CONSTRAINT fk_oi_order     FOREIGN KEY (order_id)     REFERENCES orders(id)     ON DELETE CASCADE,
    CONSTRAINT fk_oi_menuitem  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id                          BIGINT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id                    BIGINT         NOT NULL UNIQUE,
    transaction_id              VARCHAR(100)   UNIQUE,
    payment_gateway_order_id    VARCHAR(100),
    payment_gateway_payment_id  VARCHAR(100)   UNIQUE,
    amount                      DECIMAL(10,2)  NOT NULL,
    currency                    VARCHAR(10)    NOT NULL DEFAULT 'INR',
    status                      VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    payment_method              VARCHAR(30),
    payment_gateway             VARCHAR(20),
    initiated_at                DATETIME(6),
    completed_at                DATETIME(6),
    failed_at                   DATETIME(6),
    failure_reason              TEXT,
    webhook_signature           TEXT,
    gateway_response            TEXT,
    created_at                  DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at                  DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_order_payment  (order_id),
    INDEX idx_payment_status (status),
    CONSTRAINT fk_pay_order FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT       NOT NULL UNIQUE,
    first_name  VARCHAR(50),
    last_name   VARCHAR(50),
    phone       VARCHAR(20),
    bio         TEXT,
    avatar_url  VARCHAR(255),
    created_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_prof_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expires_at  DATETIME(6)  NOT NULL,
    used        TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_evt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expires_at  DATETIME(6)  NOT NULL,
    used        TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed roles
INSERT IGNORE INTO roles (name) VALUES ('ADMIN'), ('CAFE_OWNER'), ('CHEF'), ('WAITER'), ('CUSTOMER');
