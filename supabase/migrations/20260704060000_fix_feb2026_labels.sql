-- February 2026 label fixes:
-- Fix record_type for 6 adjustment entries; fix Biryanis 2/14 vendor (Morya → GMG labels)

-- 2/10 adjustments
UPDATE public.label_purchases
SET record_type = 'adjustment', reason = 'count mismatch', description = NULL
WHERE purchase_date = '2026-02-10' AND vendor_id = 'Morya labels' AND quantity = 200;

UPDATE public.label_purchases
SET record_type = 'adjustment', reason = 'count mismatch', description = NULL
WHERE purchase_date = '2026-02-10' AND vendor_id = 'Morya labels' AND quantity = 14;

-- 2/14 Biryanis count mismatch: wrong vendor + wrong record_type
UPDATE public.label_purchases
SET record_type = 'adjustment', reason = 'count mismatch', description = NULL,
    vendor_id = 'GMG labels'
WHERE purchase_date = '2026-02-14' AND vendor_id = 'Morya labels' AND quantity = 1244;

-- 2/28 adjustments
UPDATE public.label_purchases
SET record_type = 'adjustment', reason = 'count mismatch', description = NULL
WHERE purchase_date = '2026-02-28' AND vendor_id = 'Morya labels' AND quantity = -89;

UPDATE public.label_purchases
SET record_type = 'adjustment', reason = 'count mismatch', description = NULL
WHERE purchase_date = '2026-02-28' AND vendor_id = 'Morya labels' AND quantity = 305;

UPDATE public.label_purchases
SET record_type = 'adjustment', reason = 'count mismatch', description = NULL
WHERE purchase_date = '2026-02-28' AND vendor_id = 'Morya labels' AND quantity = -95;
