-- May 2026 label fixes:
-- 1. Add missing Elma Back sticker 5/8 (10100 labels, Morya Labels, ₹3575)
-- 2. Add missing Elma Back sticker 5/25 (10130 labels, Morya Labels, ₹3586)
-- 3. Fix 4 count mismatch entries on 5/31: record_type → adjustment

-- 1. Back sticker 5/8
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, description, record_type, reason)
VALUES
  ('Morya labels', NULL, 'Back Sticker', 10100, 0.354, 3575.00, '2026-05-08', NULL, 'purchase', NULL);

-- 2. Back sticker 5/25
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, description, record_type, reason)
VALUES
  ('Morya labels', NULL, 'Back Sticker', 10130, 0.354, 3586.00, '2026-05-25', NULL, 'purchase', NULL);

-- 3. Fix 5/31 count mismatch entries
UPDATE public.label_purchases
SET record_type = 'adjustment', reason = 'count mismatch', description = NULL
WHERE purchase_date = '2026-05-31'
  AND total_amount = 0
  AND record_type = 'purchase';
