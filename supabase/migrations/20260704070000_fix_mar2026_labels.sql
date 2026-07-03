-- March 2026 label fixes:
-- 1. Create new customer Hiyya / Vizag
-- 2. Remap 3/19 Hiyya Vizag label_purchase row from Hiyya Chrono → new customer
-- 3. Fix Tara South Indian 3/22: vendor Morya labels → GMG + record_type → adjustment
-- 4. Fix all 3/22 count mismatch entries: record_type → adjustment
-- 5. Fix all 3/31 count mismatch entries: record_type → adjustment
-- 6. Add missing Elma Back sticker adjustment (9688 labels, GMG, 3/31)
-- 7. Add missing Soul of South Financial District adjustment (1280 labels, Haneel, 3/31)

-- 1+2. Create Hiyya Vizag customer and remap the label purchase row
WITH new_hiyya AS (
  INSERT INTO public.customers (client_name, branch, sku, is_active, is_deprecated)
  VALUES ('Hiyya', 'Vizag', 'P 500 ml', true, false)
  RETURNING id
)
UPDATE public.label_purchases
SET client_id = (SELECT id FROM new_hiyya)
WHERE id = 'b9060ed7-16c1-4e0c-97fd-ebe1684a25e7';

-- 3. Fix Tara South Indian 3/22: vendor + record_type
UPDATE public.label_purchases
SET vendor_id = 'GMG', record_type = 'adjustment', reason = 'count mismatch', description = NULL
WHERE purchase_date = '2026-03-22'
  AND vendor_id = 'Morya labels'
  AND quantity = -720;

-- 4. Fix remaining 3/22 count mismatch entries
UPDATE public.label_purchases
SET record_type = 'adjustment', reason = 'count mismatch', description = NULL
WHERE purchase_date = '2026-03-22'
  AND total_amount = 0
  AND record_type = 'purchase';

-- 5. Fix all 3/31 count mismatch / adjustment entries
UPDATE public.label_purchases
SET record_type = 'adjustment', reason = COALESCE(reason, 'count mismatch'), description = NULL
WHERE purchase_date = '2026-03-31'
  AND total_amount = 0
  AND record_type = 'purchase';

-- 6. Add missing Elma Back sticker count mismatch adjustment (9687.92 → 9688 labels)
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, description, record_type, reason)
VALUES
  ('GMG', NULL, 'Back Sticker', 9688, 0, 0, '2026-03-31', NULL, 'adjustment', 'count mismatch');

-- 7. Add missing Soul of South Financial District adjustment (1280 labels, Haneel)
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, description, record_type, reason)
VALUES
  ('Haneel', 'c66dbbc1-95da-46bf-a01e-4d5758901dcd', 'P 500 ml', 1280, 0, 0, '2026-03-31', NULL, 'adjustment', 'Adjustment');
