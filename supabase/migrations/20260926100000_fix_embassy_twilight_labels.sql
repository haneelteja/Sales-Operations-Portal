-- Embassy Twilight label purchases were all inserted with NULL client_id because
-- migrations used ILIKE 'Twilight Embassy%' but the actual DB name is 'Embassy Twilight'.
-- This migration:
--   1. Links those orphaned entries to the correct client.
--   2. Removes the duplicate rows created when 20260925090000 re-inserted them
--      (the NOT EXISTS guard used client_id = NULL which is never matched, so
--      every entry was inserted twice).
--   3. Adds the pre-Jul 2026 opening balance (1,260 labels) that was never entered —
--      brings total purchased to 3,320 = Elma printed, leaving remaining = 0.

-- Step 1: link orphaned entries to Embassy Twilight
UPDATE public.label_purchases
SET client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Embassy Twilight' LIMIT 1)
WHERE client_id IS NULL
  AND sku = 'P 500 ml'
  AND (
       (purchase_date = '2026-07-21' AND quantity = 1207)
    OR (purchase_date = '2026-08-31' AND quantity = -207)
    OR (purchase_date = '2026-09-11' AND quantity = 1132)
    OR (purchase_date = '2026-09-14' AND quantity = -72)
  );

-- Step 2: deduplicate — for each (purchase_date, quantity) pair keep only one row
-- (ctid is a stable physical row id available in every Postgres table)
DELETE FROM public.label_purchases lp_outer
WHERE client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Embassy Twilight' LIMIT 1)
  AND sku = 'P 500 ml'
  AND EXISTS (
    SELECT 1 FROM public.label_purchases lp_inner
    WHERE lp_inner.client_id = lp_outer.client_id
      AND lp_inner.sku      = lp_outer.sku
      AND lp_inner.purchase_date = lp_outer.purchase_date
      AND lp_inner.quantity      = lp_outer.quantity
      AND lp_inner.ctid < lp_outer.ctid
  );

-- Step 3: add pre-Jul 2026 opening balance (3,320 total - 2,060 from Jul-Sep batches = 1,260)
INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  (SELECT id FROM public.label_vendors WHERE lower(vendor_name) = 'morya labels' LIMIT 1),
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Embassy Twilight' LIMIT 1),
  'P 500 ml', 1260, 0.9440, 1189.44, '2026-06-30', 'adjustment',
  'pre-Jul 2026 opening balance — label reconciliation'
WHERE NOT EXISTS (
  SELECT 1 FROM public.label_purchases
  WHERE purchase_date = '2026-06-30'
    AND quantity = 1260
    AND client_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Embassy Twilight' LIMIT 1)
);
