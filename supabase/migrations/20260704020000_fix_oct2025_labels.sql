-- October 2025 label fixes:
-- 1. Fix Chaitanya's 10/17 adjustment: record_type purchase → adjustment
-- 2. Add missing Elma Back sticker 10/25 (GMG, 53000 labels, ₹13780)

UPDATE public.label_purchases
SET record_type = 'adjustment'
WHERE purchase_date = '2025-10-17'
  AND vendor_id = 'Morya labels'
  AND quantity = -4530;

INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, description, record_type)
VALUES
  ('GMG', NULL, 'Back Sticker', 53000, 0, 13780.00, '2025-10-25', 'Elma Back sticker', 'purchase');
