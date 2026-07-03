-- November 2025 label fixes:
-- Fix Maryadha Ramanna 11/6 adjustment: record_type purchase → adjustment, add reason

UPDATE public.label_purchases
SET
  record_type = 'adjustment',
  reason      = 'count mismatch'
WHERE purchase_date = '2025-11-06'
  AND vendor_id = 'GMG labels'
  AND quantity = -1000;
