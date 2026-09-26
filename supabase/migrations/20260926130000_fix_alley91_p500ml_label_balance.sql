-- Alley 91 P 500ml label balance reconciliation.
-- Elma remaining = 0 labels. Next Lot sheet D = 100 labels in physical stock.
-- Target = 0 + 100 = 100 labels available.
--
-- Bottles per case for P 500 ml = 20 (from sku_configurations).
-- Adjustment delta is computed at migration time.

INSERT INTO public.label_purchases
  (vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, record_type, reason)
SELECT
  NULL,
  c.id,
  'P 500 ml',
  100 - (
    COALESCE((
      SELECT SUM(lp2.quantity)
      FROM public.label_purchases lp2
      WHERE lp2.client_id = c.id AND lp2.sku = 'P 500 ml'
    ), 0)
    -
    GREATEST(
      COALESCE((
        SELECT SUM(fp.quantity) * 20
        FROM public.factory_payables fp
        WHERE fp.customer_id = c.id
          AND fp.sku = 'P 500 ml'
          AND fp.transaction_type = 'production'
      ), 0),
      COALESCE((
        SELECT SUM(st.quantity) * 20
        FROM public.sales_transactions st
        WHERE st.customer_id = c.id
          AND st.sku = 'P 500 ml'
          AND st.transaction_type = 'sale'
      ), 0)
    )
  ),
  0, 0, '2026-09-26', 'adjustment',
  'reconciliation Sep-2026 — set available to Elma 0 + next lot 100'
FROM public.customers c
WHERE c.client_name ILIKE 'Alley 91'
  AND c.sku = 'P 500 ml'
  AND NOT EXISTS (
    SELECT 1 FROM public.label_purchases
    WHERE client_id = c.id
      AND sku = 'P 500 ml'
      AND record_type = 'adjustment'
      AND reason = 'reconciliation Sep-2026 — set available to Elma 0 + next lot 100'
  )
LIMIT 1;
