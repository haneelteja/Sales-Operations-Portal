-- Alley 91 P 250ml: portal Available = -12,549, Elma remaining = 9,054.
-- No purchase records exist for this SKU (Purchased = 0), only a -2,049 adjustment.
-- Add +21,603 adjustment to bring available to 9,054.

INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1),
  'P 250 ml', 21603, 0, 0, '2026-09-25', 'adjustment',
  'Elma opening balance'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Alley 91' LIMIT 1)
    AND sku = 'P 250 ml'
    AND quantity = 21603
    AND record_type = 'adjustment'
    AND reason = 'Elma opening balance'
);
