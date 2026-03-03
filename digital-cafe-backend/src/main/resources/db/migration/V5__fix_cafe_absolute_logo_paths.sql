-- V5: Fix cafes whose logo_url / cover_url is an absolute filesystem path.
-- First ensure both columns exist (they may not if JPA ddl-auto hasn't run yet).

SET @has_logo = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE table_schema = DATABASE()
                   AND table_name   = 'cafes'
                   AND column_name  = 'logo_url');
SET @sql_logo = IF(@has_logo > 0, 'SELECT 1', 'ALTER TABLE cafes ADD COLUMN logo_url VARCHAR(255) NULL');
PREPARE _stmt FROM @sql_logo; EXECUTE _stmt; DEALLOCATE PREPARE _stmt;

SET @has_cover = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                  WHERE table_schema = DATABASE()
                    AND table_name   = 'cafes'
                    AND column_name  = 'cover_url');
SET @sql_cover = IF(@has_cover > 0, 'SELECT 1', 'ALTER TABLE cafes ADD COLUMN cover_url VARCHAR(255) NULL');
PREPARE _stmt FROM @sql_cover; EXECUTE _stmt; DEALLOCATE PREPARE _stmt;

-- Fix logo_url: strip absolute path prefix, keep only filename under /uploads/
UPDATE cafes
SET logo_url = CONCAT('/uploads/', SUBSTRING_INDEX(REPLACE(logo_url, '\\', '/'), '/', -1))
WHERE logo_url IS NOT NULL
  AND logo_url != ''
  AND logo_url NOT LIKE '/%'
  AND logo_url NOT LIKE 'http%'
  AND logo_url NOT LIKE 's3://%';

-- Fix cover_url: same treatment
UPDATE cafes
SET cover_url = CONCAT('/uploads/', SUBSTRING_INDEX(REPLACE(cover_url, '\\', '/'), '/', -1))
WHERE cover_url IS NOT NULL
  AND cover_url != ''
  AND cover_url NOT LIKE '/%'
  AND cover_url NOT LIKE 'http%'
  AND cover_url NOT LIKE 's3://%';
