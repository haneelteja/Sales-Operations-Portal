-- September 2025 label fixes:
-- 1. Fix 9/3 this is it café: description 'count mismatch' → 'Digital'
-- 2. Add missing Elma Back sticker 9/20 (GMG, 50000 labels, ₹13000)
-- 3. Fix record_type for two 9/30 Haneel adjustment entries

UPDATE public.label_purchases
SET description = 'Digital'
WHERE purchase_date = '2025-09-03'
  AND vendor_id = 'GMG'
  AND quantity = 430;

INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, description, record_type)
VALUES
  ('GMG', NULL, 'Back Sticker', 50000, 0, 13000.00, '2025-09-20', 'Elma Back sticker', 'purchase');

UPDATE public.label_purchases
SET record_type = 'adjustment'
WHERE purchase_date = '2025-09-30' AND vendor_id = 'Haneel' AND quantity = 8688;

UPDATE public.label_purchases
SET record_type = 'adjustment'
WHERE purchase_date = '2025-09-30' AND vendor_id = 'Haneel' AND quantity = 3820;
