-- Iron hill café P 500 ml: portal net_purchased = 17,270 vs Elma printed = 18,246.
-- Portal remaining = 1,150; Elma remaining = 3,206. Gap = 2,056.
-- Adding 2,056 label adjustment brings portal remaining in line with Elma.

INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name) = 'morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill%' AND branch ILIKE '%Madhapur%' LIMIT 1),
  'P 500 ml', 2056, 0.9440, 1940.86, '2026-09-25', 'adjustment',
  'label balance reconciliation Sep-2026 — match Elma remaining 3206'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-09-25'
    AND record_type = 'adjustment'
    AND reason = 'label balance reconciliation Sep-2026 — match Elma remaining 3206'
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Iron hill%' AND branch ILIKE '%Madhapur%' LIMIT 1)
);
