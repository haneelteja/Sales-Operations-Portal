-- Backfill all factory_payables production amounts after EL 500 ml pricing corrections.
-- EL 500 ml pricing now:
--   before 2026-03-10 → ₹88.00/case  (50 cases = ₹4,400)
--   2026-03-10 onward → ₹103.00/case
--   2026-05-01 onward → ₹101.40/case

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
