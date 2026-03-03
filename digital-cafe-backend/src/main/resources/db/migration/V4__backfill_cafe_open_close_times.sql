-- V4: Ensure open_time / close_time columns exist, then back-fill hours.
-- MySQL 8.0 lacks ADD COLUMN IF NOT EXISTS, so we use conditional prepared statements.

SET @has_open = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'cafes' AND column_name = 'open_time');
SET @sql_open = IF(@has_open > 0, 'SELECT 1', 'ALTER TABLE cafes ADD COLUMN open_time VARCHAR(10) NULL');
PREPARE _stmt FROM @sql_open; EXECUTE _stmt; DEALLOCATE PREPARE _stmt;

SET @has_close = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'cafes' AND column_name = 'close_time');
SET @sql_close = IF(@has_close > 0, 'SELECT 1', 'ALTER TABLE cafes ADD COLUMN close_time VARCHAR(10) NULL');
PREPARE _stmt FROM @sql_close; EXECUTE _stmt; DEALLOCATE PREPARE _stmt;

UPDATE cafes SET open_time = '07:00', close_time = '22:00' WHERE name = 'The Monsoon Mug'       AND (open_time IS NULL OR open_time = '');
UPDATE cafes SET open_time = '06:30', close_time = '21:30' WHERE name = 'The Chai Chronicles'   AND (open_time IS NULL OR open_time = '');
UPDATE cafes SET open_time = '07:30', close_time = '23:00' WHERE name = 'Roast & Relish'        AND (open_time IS NULL OR open_time = '');
UPDATE cafes SET open_time = '08:00', close_time = '21:00' WHERE name = 'Saffron Sip'           AND (open_time IS NULL OR open_time = '');
UPDATE cafes SET open_time = '07:00', close_time = '21:00' WHERE name = 'Brew & Bloom'          AND (open_time IS NULL OR open_time = '');
UPDATE cafes SET open_time = '06:00', close_time = '21:00' WHERE name = 'Nilgiri Nest'          AND (open_time IS NULL OR open_time = '');

UPDATE cafes SET open_time  = '09:00' WHERE open_time  IS NULL OR open_time  = '';
UPDATE cafes SET close_time = '21:00' WHERE close_time IS NULL OR close_time = '';
