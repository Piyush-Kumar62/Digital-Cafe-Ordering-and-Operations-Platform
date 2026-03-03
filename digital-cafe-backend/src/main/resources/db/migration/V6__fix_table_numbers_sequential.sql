-- Fix table numbers that were auto-generated as T{timestamp} (13+ digit suffix)
-- Replace them with clean sequential numbers per café: T1, T2, T3 …
UPDATE cafe_tables ct
JOIN (
    SELECT
        ct2.id,
        ROW_NUMBER() OVER (PARTITION BY ct2.cafe_id ORDER BY ct2.id) AS rn
    FROM cafe_tables ct2
    WHERE ct2.table_number REGEXP '^T[0-9]{10,}$'
) ranked ON ct.id = ranked.id
SET ct.table_number = CONCAT('T', ranked.rn);
