-- Run this in phpMyAdmin on the live database if you cannot run `php artisan migrate`.
-- Converts stored sizes from millimetres to inches and removes stitch_count.

UPDATE products SET width_mm = ROUND(width_mm / 25.4, 2) WHERE width_mm IS NOT NULL AND width_mm > 20;
UPDATE products SET height_mm = ROUND(height_mm / 25.4, 2) WHERE height_mm IS NOT NULL AND height_mm > 20;

ALTER TABLE products DROP COLUMN stitch_count;
