-- Minimal test data for local/dev smoke tests

INSERT INTO roles (name) VALUES ('ADMIN') ON DUPLICATE KEY UPDATE name = name;
INSERT INTO roles (name) VALUES ('CUSTOMER') ON DUPLICATE KEY UPDATE name = name;

INSERT INTO users (username, email, password, enabled, created_at)
VALUES ('admin@digitalcafe.com', 'admin@digitalcafe.com', 'bcrypt:placeholder', TRUE, NOW())
ON DUPLICATE KEY UPDATE username = username;

INSERT INTO cafes (owner_id, name, status, created_at)
VALUES (1, 'Demo Cafe', 'ACTIVE', NOW())
ON DUPLICATE KEY UPDATE name = name;
