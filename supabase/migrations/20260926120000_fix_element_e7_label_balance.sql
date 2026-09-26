-- Element E7 P 1000ml label balance reconciliation.
-- Elma remaining = 716 labels. Next Lot sheet D = 100 labels in physical stock.
-- Target = 716 + 100 = 816 labels available.
--
-- Bottles per case for P 1000 ml = 12 (from sku_configurations).
-- Adjustment delta is computed at migration time so it is correct regardless of
-- whether Sep 22-26 factory entries were already present from live portal entry.

INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  c.id,
  'P 1000 ml',
  816 - (
    COALESCE((
      SELECT SUM(lp2.quantity)
      FROM public.label_purchases lp2
      WHERE lp2.client_id = c.id AND lp2.sku = 'P 1000 ml'
    ), 0)
    -
    GREATEST(
      COALESCE((
        SELECT SUM(fp.quantity) * 12
        FROM public.factory_payables fp
        WHERE fp.customer_id = c.id
          AND fp.sku = 'P 1000 ml'
          AND fp.transaction_type = 'production'
      ), 0),
      COALESCE((
        SELECT SUM(st.quantity) * 12
        FROM public.sales_transactions st
        WHERE st.customer_id = c.id
          AND st.sku = 'P 1000 ml'
          AND st.transaction_type = 'sale'
      ), 0)
    )
  ),
  0, 0, '2026-09-26', 'adjustment',
  'reconciliation Sep-2026 — set available to Elma 716 + next lot 100'
FROM public.customers c
WHERE c.client_name ILIKE 'Element E7'
  AND c.sku = 'P 1000 ml'
  AND NOT EXISTS (
    SELECT 1 FROM public.label_purchases
    WHERE client_id = c.id
      AND sku = 'P 1000 ml'
      AND record_type = 'adjustment'
      AND reason = 'reconciliation Sep-2026 — set available to Elma 716 + next lot 100'
  )
LIMIT 1;
