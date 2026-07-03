-- August 2025 label fixes:
-- 1. Add missing Elma Back sticker (GMG, 8/19)
-- 2. Fix Biryanis+More 8/19 row → correct client to Tilaks Kitchen
-- 3. Fix Blossamin Spa 8/2: wrong vendor (Morya labels → Haneel) + set adjustment fields
-- 4. Set record_type='adjustment' for all 5 Haneel adjustment entries

-- 1. Missing Elma Back sticker
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, description, record_type)
VALUES
  ('GMG', NULL, 'Back Sticker', 50000, 0, 13000.00, '2025-08-19', 'Elma Back sticker', 'purchase');

-- 2. Fix Biryanis and More row → Tilaks Kitchen (wrong client_id, wrong description)
UPDATE public.label_purchases
SET
  client_id   = 'd2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6',
  description = NULL
WHERE id = '6f288b49-8181-4b1b-bed2-f628b3b58381';

-- 3. Fix Blossamin Spa 8/2: vendor, record_type, reason
UPDATE public.label_purchases
SET
  vendor_id   = 'Haneel',
  record_type = 'adjustment',
  reason      = 'label size issue',
  description = NULL
WHERE purchase_date = '2025-08-02' AND quantity = -12000;

-- 4. Fix remaining adjustment entries (Gismat 8/1, and three 8/31 entries)
UPDATE public.label_purchases
SET record_type = 'adjustment'
WHERE purchase_date = '2025-08-01' AND vendor_id = 'Haneel' AND quantity = 2500;

UPDATE public.label_purchases
SET record_type = 'adjustment'
WHERE purchase_date = '2025-08-31' AND vendor_id = 'Haneel' AND quantity = 260;

UPDATE public.label_purchases
SET record_type = 'adjustment'
WHERE purchase_date = '2025-08-31' AND vendor_id = 'Haneel' AND quantity = -300;

UPDATE public.label_purchases
SET record_type = 'adjustment'
WHERE purchase_date = '2025-08-31' AND vendor_id = 'Haneel' AND quantity = 2540;
