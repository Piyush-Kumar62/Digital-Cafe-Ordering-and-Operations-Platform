-- Digital Cafe Database Initial Setup Script

-- Create Database
CREATE DATABASE IF NOT EXISTS digital_cafe_db;
USE digital_cafe_db;

-- Sample Categories
INSERT INTO categories (name, description, active, created_at, updated_at) VALUES
('Beverages', 'Hot and cold drinks', true, NOW(), NOW()),
('Food', 'Meals and snacks', true, NOW(), NOW()),
('Desserts', 'Sweet treats', true, NOW(), NOW()),
('Breakfast', 'Morning specials', true, NOW(), NOW());

-- Sample Cafes
INSERT INTO cafes (name, address, city, phone, email, opening_time, closing_time, active, created_at, updated_at) VALUES
('Downtown Cafe', '123 Main Street', 'New York', '555-0100', 'downtown@cafe.com', '07:00', '22:00', true, NOW(), NOW()),
('Uptown Cafe', '456 Park Avenue', 'New York', '555-0200', 'uptown@cafe.com', '08:00', '20:00', true, NOW(), NOW()),
('Brooklyn Cafe', '789 Brooklyn Bridge', 'Brooklyn', '555-0300', 'brooklyn@cafe.com', '06:00', '21:00', true, NOW(), NOW());

-- Sample Users
INSERT INTO users (name, email, password, phone, role, active, created_at, updated_at) VALUES
('Admin User', 'admin@cafe.com', 'admin123', '555-1000', 'ADMIN', true, NOW(), NOW()),
('Manager One', 'manager1@cafe.com', 'manager123', '555-1001', 'MANAGER', true, NOW(), NOW()),
('Staff Member', 'staff1@cafe.com', 'staff123', '555-1002', 'STAFF', true, NOW(), NOW()),
('John Customer', 'john@example.com', 'customer123', '555-2001', 'CUSTOMER', true, NOW(), NOW()),
('Jane Customer', 'jane@example.com', 'customer123', '555-2002', 'CUSTOMER', true, NOW(), NOW());

-- Sample Menu Items for Downtown Cafe (cafe_id = 1)
INSERT INTO menu_items (name, description, price, category_id, cafe_id, image_url, available, active, created_at, updated_at) VALUES
-- Beverages
('Espresso', 'Rich and strong coffee', 3.00, 1, 1, null, true, true, NOW(), NOW()),
('Cappuccino', 'Espresso with steamed milk foam', 4.50, 1, 1, null, true, true, NOW(), NOW()),
('Latte', 'Smooth espresso with steamed milk', 4.50, 1, 1, null, true, true, NOW(), NOW()),
('Americano', 'Espresso with hot water', 3.50, 1, 1, null, true, true, NOW(), NOW()),
('Cold Brew', 'Smooth cold coffee', 4.00, 1, 1, null, true, true, NOW(), NOW()),
('Green Tea', 'Fresh brewed green tea', 3.00, 1, 1, null, true, true, NOW(), NOW()),
-- Food
('Chicken Sandwich', 'Grilled chicken with fresh vegetables', 8.50, 2, 1, null, true, true, NOW(), NOW()),
('Caesar Salad', 'Fresh romaine with parmesan', 7.50, 2, 1, null, true, true, NOW(), NOW()),
('Margherita Pizza', 'Classic tomato and mozzarella', 12.00, 2, 1, null, true, true, NOW(), NOW()),
('Pasta Carbonara', 'Creamy pasta with bacon', 11.50, 2, 1, null, true, true, NOW(), NOW()),
-- Desserts
('Chocolate Cake', 'Rich chocolate layer cake', 5.50, 3, 1, null, true, true, NOW(), NOW()),
('Cheesecake', 'New York style cheesecake', 6.00, 3, 1, null, true, true, NOW(), NOW()),
('Apple Pie', 'Homemade apple pie', 5.00, 3, 1, null, true, true, NOW(), NOW()),
-- Breakfast
('Pancakes', 'Fluffy pancakes with syrup', 7.00, 4, 1, null, true, true, NOW(), NOW()),
('Eggs Benedict', 'Poached eggs on English muffin', 9.50, 4, 1, null, true, true, NOW(), NOW()),
('French Toast', 'Classic French toast', 7.50, 4, 1, null, true, true, NOW(), NOW());

-- Sample Menu Items for Uptown Cafe (cafe_id = 2)
INSERT INTO menu_items (name, description, price, category_id, cafe_id, image_url, available, active, created_at, updated_at) VALUES
('Mocha', 'Chocolate espresso drink', 5.00, 1, 2, null, true, true, NOW(), NOW()),
('Club Sandwich', 'Triple-decker sandwich', 9.00, 2, 2, null, true, true, NOW(), NOW()),
('Tiramisu', 'Italian coffee-flavored dessert', 6.50, 3, 2, null, true, true, NOW(), NOW());

-- Sample Cafe Tables
INSERT INTO cafe_tables (table_number, capacity, cafe_id, status, active, created_at, updated_at) VALUES
-- Downtown Cafe Tables
('T1', 2, 1, 'AVAILABLE', true, NOW(), NOW()),
('T2', 2, 1, 'AVAILABLE', true, NOW(), NOW()),
('T3', 4, 1, 'AVAILABLE', true, NOW(), NOW()),
('T4', 4, 1, 'AVAILABLE', true, NOW(), NOW()),
('T5', 6, 1, 'AVAILABLE', true, NOW(), NOW()),
('T6', 8, 1, 'AVAILABLE', true, NOW(), NOW()),
-- Uptown Cafe Tables
('T1', 2, 2, 'AVAILABLE', true, NOW(), NOW()),
('T2', 4, 2, 'AVAILABLE', true, NOW(), NOW()),
('T3', 4, 2, 'AVAILABLE', true, NOW(), NOW()),
('T4', 6, 2, 'AVAILABLE', true, NOW(), NOW()),
-- Brooklyn Cafe Tables
('T1', 2, 3, 'AVAILABLE', true, NOW(), NOW()),
('T2', 2, 3, 'AVAILABLE', true, NOW(), NOW()),
('T3', 4, 3, 'AVAILABLE', true, NOW(), NOW());

-- Sample Table Bookings
INSERT INTO table_bookings (customer_id, table_id, booking_date, number_of_guests, special_requests, status, created_at, updated_at) VALUES
(4, 1, '2026-02-05 12:00:00', 2, 'Window seat preferred', 'CONFIRMED', NOW(), NOW()),
(5, 3, '2026-02-05 18:30:00', 4, 'Birthday celebration', 'CONFIRMED', NOW(), NOW());

-- Sample Orders (Note: You may need to adjust IDs based on actual inserted data)
INSERT INTO orders (order_number, customer_id, cafe_id, status, order_type, total_amount, special_instructions, delivery_address, created_at, updated_at) VALUES
('ORD20260204120000', 4, 1, 'COMPLETED', 'DINE_IN', 17.50, null, null, NOW(), NOW()),
('ORD20260204130000', 5, 1, 'PREPARING', 'TAKEAWAY', 24.00, 'Extra napkins please', null, NOW(), NOW());

-- Sample Order Items (for the first order - adjust order_id as needed)
-- Order 1: Cappuccino (2) + Chicken Sandwich (1)
INSERT INTO order_items (order_id, menu_item_id, quantity, price, subtotal, notes) VALUES
(1, 2, 2, 4.50, 9.00, 'No sugar'),
(1, 7, 1, 8.50, 8.50, null);

-- Order 2: Latte (2) + Caesar Salad (1) + Chocolate Cake (2)
INSERT INTO order_items (order_id, menu_item_id, quantity, price, subtotal, notes) VALUES
(2, 3, 2, 4.50, 9.00, null),
(2, 8, 1, 7.50, 7.50, 'No croutons'),
(2, 11, 2, 5.50, 11.00, null);

-- Verify Data
SELECT 'Categories:' as Info, COUNT(*) as Count FROM categories
UNION ALL
SELECT 'Cafes:', COUNT(*) FROM cafes
UNION ALL
SELECT 'Users:', COUNT(*) FROM users
UNION ALL
SELECT 'Menu Items:', COUNT(*) FROM menu_items
UNION ALL
SELECT 'Cafe Tables:', COUNT(*) FROM cafe_tables
UNION ALL
SELECT 'Table Bookings:', COUNT(*) FROM table_bookings
UNION ALL
SELECT 'Orders:', COUNT(*) FROM orders
UNION ALL
SELECT 'Order Items:', COUNT(*) FROM order_items;
