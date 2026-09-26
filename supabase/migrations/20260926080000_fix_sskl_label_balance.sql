-- SSKL P 250 ml: portal net_purchased = 24,660 vs Elma printed = 44,940.
-- Portal remaining = 450; Elma remaining = 19,920. Gap = 19,470.
-- Adding 19,470 label adjustment brings portal remaining in line with Elma.

INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name) = 'morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name = 'SSKL' AND branch ILIKE '%Kalamandir%' LIMIT 1),
  'P 250 ml', 19470, 0.4000, 7788.00, '2026-09-25', 'adjustment',
  'label balance reconciliation Sep-2026 — match Elma remaining 19920'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-09-25'
    AND record_type = 'adjustment'
    AND reason = 'label balance reconciliation Sep-2026 — match Elma remaining 19920'
    AND client_id = (SELECT id FROM public.customers WHERE client_name = 'SSKL' AND branch ILIKE '%Kalamandir%' LIMIT 1)
);
