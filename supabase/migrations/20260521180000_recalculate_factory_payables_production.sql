-- Recalculate all factory_payables production rows against current factory_pricing.
-- For each production row, applies the latest pricing_date <= transaction_date for that SKU.
-- Only updates rows where the stored amount differs from quantity * cost_per_case by >= ₹0.01.
-- Safe to re-run: already-correct rows are untouched.

WITH corrections AS (
  SELECT
    fp.id,
    ROUND((fp.quantity * pr.cost_per_case)::numeric, 2) AS correct_amount
  FROM public.factory_payables fp
  JOIN LATERAL (
    SELECT cost_per_case
    FROM public.factory_pricing
    WHERE sku = fp.sku
      AND pricing_date <= fp.transaction_date::date
    ORDER BY pricing_date DESC
    LIMIT 1
  ) pr ON true
  WHERE fp.transaction_type = 'production'
    AND fp.quantity IS NOT NULL
    AND ABS(fp.amount - fp.quantity * pr.cost_per_case) >= 0.01
)
UPDATE public.factory_payables fp
SET amount = c.correct_amount
FROM corrections c
WHERE fp.id = c.id;
