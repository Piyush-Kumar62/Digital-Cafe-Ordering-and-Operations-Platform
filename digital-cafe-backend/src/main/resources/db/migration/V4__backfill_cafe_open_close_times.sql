-- V4: Back-fill open_time / close_time for cafes that were created
-- before the CafeRequest field-name fix (openingTime→openTime).
-- These rows have NULL because Jackson silently dropped the old-name fields.

-- Known seed café names get their real hours restored
UPDATE cafes SET open_time = '07:00', close_time = '22:00'
  WHERE name = 'The Monsoon Mug'
    AND (open_time IS NULL OR open_time = '');

UPDATE cafes SET open_time = '06:30', close_time = '21:30'
  WHERE name = 'The Chai Chronicles'
    AND (open_time IS NULL OR open_time = '');

UPDATE cafes SET open_time = '07:30', close_time = '23:00'
  WHERE name = 'Roast & Relish'
    AND (open_time IS NULL OR open_time = '');

UPDATE cafes SET open_time = '08:00', close_time = '21:00'
  WHERE name = 'Saffron Sip'
    AND (open_time IS NULL OR open_time = '');

UPDATE cafes SET open_time = '07:00', close_time = '21:00'
  WHERE name = 'Brew & Bloom'
    AND (open_time IS NULL OR open_time = '');

UPDATE cafes SET open_time = '06:00', close_time = '21:00'
  WHERE name = 'Nilgiri Nest'
    AND (open_time IS NULL OR open_time = '');

-- Any remaining cafes still missing open_time get a sensible default
UPDATE cafes SET open_time = '09:00' WHERE open_time IS NULL OR open_time = '';

-- Any remaining cafes still missing close_time get a sensible default
UPDATE cafes SET close_time = '21:00' WHERE close_time IS NULL OR close_time = '';
