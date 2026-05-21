-- Root cause fix: price_per_bottle was DECIMAL(10,2) — truncated 5.9381 to 5.94,
-- so cost_per_case computed to 124.74 instead of 124.70.
-- 1. Widen price_per_bottle to NUMERIC (unrestricted precision).
-- 2. Set price_per_bottle = 124.7 / 1.05 / 20 for P 500 ml 2026-05-01.
-- 3. Verify P 500 ml pricing.
-- 4. Backfill all factory_payables production amounts.

-- Step 1: Widen column type
ALTER TABLE public.factory_pricing
  ALTER COLUMN price_per_bottle TYPE NUMERIC;

-- Step 2: Correct price_per_bottle for P 500 ml 2026-05-01
--   124.7 / 1.05 / 20 = 5.938095238...
--   ROUND(5.938095... * 1.05 * 20, 2) = ROUND(124.6999..., 2) = 124.70
UPDATE public.factory_pricing
SET price_per_bottle = 124.7 / 1.05 / 20
WHERE sku = 'P 500 ml'
  AND pricing_date = '2026-05-01';

-- Step 3: Verify
SELECT sku, pricing_date, price_per_bottle, tax, bottles_per_case, cost_per_case
FROM public.factory_pricing
WHERE sku = 'P 500 ml'
ORDER BY pricing_date DESC;

-- Step 4: Backfill all production payables
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
