-- January 2026 label fixes:
-- 1. Fix 1/13 "Gismat New" 3207 stored as Jismat → correct to Gismat client
-- 2. Fix 1/5 Gismat New 155 count mismatch: record_type purchase → adjustment

-- "Gismat New" in Elma = Gismat (c23daee9-4068-4024-b50c-50cb6bbde582) in portal
UPDATE public.label_purchases
SET client_id = 'c23daee9-4068-4024-b50c-50cb6bbde582'
WHERE id = '4e2c7a82-7d2e-44da-9c59-778004cdb2b0';

UPDATE public.label_purchases
SET record_type = 'adjustment', reason = 'count mismatch', description = NULL
WHERE purchase_date = '2026-01-05'
  AND vendor_id = 'Morya labels'
  AND quantity = 155;
