-- April 2026 label fixes:
-- 1. Add missing Elma Back sticker (10052 labels, Morya Labels, 4/10)
-- 2. Fix 3 count mismatch entries on 4/30: record_type → adjustment

-- 1. Add missing back sticker purchase
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, description, record_type, reason)
VALUES
  ('Morya labels', NULL, 'Back Sticker', 10052, 0.354, 3558.00, '2026-04-10', NULL, 'purchase', NULL);

-- 2. Fix 4/30 count mismatch entries
UPDATE public.label_purchases
SET record_type = 'adjustment', reason = 'count mismatch', description = NULL
WHERE purchase_date = '2026-04-30'
  AND total_amount = 0
  AND record_type = 'purchase';
