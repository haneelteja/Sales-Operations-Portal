-- Fix P 1000 ml Oct 2025 price: 101.40 → 101.43
-- Our earlier migration incorrectly set ppb = 101.4/(1.05*12) = 8.0476...
-- Reference data confirms correct price is 101.43/case.
-- ppb = 8.05 exactly: 8.05 * 1.05 * 12 = 101.43
--
-- This affects all factory_payables production rows dated 2025-10-01 through
-- 2026-03-09 (before the 2026-03-10 pricing row takes over at 120.40).

-- 1. Fix the factory_pricing row
UPDATE public.factory_pricing
SET price_per_bottle = 8.05
WHERE sku          = 'P 1000 ml'
  AND pricing_date = '2025-10-01';

-- Confirm cost_per_case is now 101.43
SELECT sku, pricing_date, price_per_bottle, cost_per_case
FROM public.factory_pricing
WHERE sku = 'P 1000 ml'
ORDER BY pricing_date;

-- 2. Backfill factory_payables: recalculate all P 1000 ml production rows
--    that fall in the Oct 2025 pricing period
WITH corrections AS (
  SELECT
    fp.id,
    ROUND((fp.quantity * pr.cost_per_case)::numeric, 2) AS correct_amount
  FROM public.factory_payables fp
  JOIN LATERAL (
    SELECT cost_per_case
    FROM public.factory_pricing
    WHERE sku          = fp.sku
      AND pricing_date <= fp.transaction_date::date
    ORDER BY pricing_date DESC
    LIMIT 1
  ) pr ON true
  WHERE fp.transaction_type = 'production'
    AND fp.sku              = 'P 1000 ml'
    AND fp.quantity IS NOT NULL
)
UPDATE public.factory_payables fp
SET amount = c.correct_amount
FROM corrections c
WHERE fp.id = c.id
  AND fp.amount IS DISTINCT FROM c.correct_amount;

-- 3. Verify: show updated P 1000 ml rows for problem dates
SELECT
  fp.transaction_date::date AS tx_date,
  c.client_name,
  c.branch,
  fp.quantity,
  fp.amount,
  pr.cost_per_case
FROM public.factory_payables fp
JOIN public.customers c ON c.id = fp.customer_id
JOIN LATERAL (
  SELECT cost_per_case
  FROM public.factory_pricing
  WHERE sku          = fp.sku
    AND pricing_date <= fp.transaction_date::date
  ORDER BY pricing_date DESC
  LIMIT 1
) pr ON true
WHERE fp.sku              = 'P 1000 ml'
  AND fp.transaction_type = 'production'
  AND fp.transaction_date::date BETWEEN '2026-01-01' AND '2026-03-09'
ORDER BY fp.transaction_date::date;
