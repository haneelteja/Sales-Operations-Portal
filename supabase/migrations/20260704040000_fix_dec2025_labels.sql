-- December 2025 label fixes:
-- 1. Add missing Elma Back sticker 12/6 (GMG, 50000 labels, ₹13000)
-- 2. Fix record_type for 6 adjustment entries on 12/31

INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, description, record_type)
VALUES
  ('GMG', NULL, 'Back Sticker', 50000, 0, 13000.00, '2025-12-06', 'Elma Back sticker', 'purchase');

-- Benguluru Bhavan -2080 count mismatch (GMG labels)
UPDATE public.label_purchases
SET record_type = 'adjustment', reason = 'count mismatch'
WHERE purchase_date = '2025-12-31' AND vendor_id = 'GMG labels' AND quantity = -2080;

-- Soul of South +40 count mismatch (Morya)
UPDATE public.label_purchases
SET record_type = 'adjustment', reason = 'count mismatch', description = NULL
WHERE purchase_date = '2025-12-31' AND vendor_id = 'Morya labels' AND quantity = 40;

-- Alley 91 -470 count mismatch (Morya)
UPDATE public.label_purchases
SET record_type = 'adjustment', reason = 'count mismatch', description = NULL
WHERE purchase_date = '2025-12-31' AND vendor_id = 'Morya labels' AND quantity = -470;

-- Gismat -11220 Converted to Jismat (Morya)
UPDATE public.label_purchases
SET record_type = 'adjustment', reason = 'Converted to Jismat', description = NULL
WHERE purchase_date = '2025-12-31' AND vendor_id = 'Morya labels' AND quantity = -11220;

-- Biryanis and More +6000 ABS Stock
UPDATE public.label_purchases
SET record_type = 'adjustment', reason = 'ABS Stock'
WHERE purchase_date = '2025-12-31' AND vendor_id = 'ABS' AND quantity = 6000;

-- Element E7 -1404 count mismatch (GMG labels)
UPDATE public.label_purchases
SET record_type = 'adjustment', reason = 'count mismatch'
WHERE purchase_date = '2025-12-31' AND vendor_id = 'GMG labels' AND quantity = -1404;
