-- Fix P 500 ml pricing for 2026-05-01:
--   price_per_bottle was 5.94, giving cost_per_case = 124.74 (off by 0.04).
--   Correct value: 124.7 / (1.05 * 20) = 124.7 / 21 ≈ 5.9381.
--
-- Also rebuilds cost_per_case generated column with ROUND(..., 2) for clean output.
-- Existing values are unaffected by the rounding change (all were already clean to 2 dp).

-- Step 1: Rebuild cost_per_case with ROUND to 2 decimal places
ALTER TABLE public.factory_pricing DROP COLUMN cost_per_case;
ALTER TABLE public.factory_pricing
  ADD COLUMN cost_per_case numeric GENERATED ALWAYS AS (
    ROUND((price_per_bottle * (1 + COALESCE(tax, 0) / 100.0) * bottles_per_case)::numeric, 2)
  ) STORED;

-- Step 2: Set price_per_bottle so cost_per_case = exactly 124.70
-- 124.7 / 1.05 / 20 = 5.938095238...  → ROUND(5.938095... * 1.05 * 20, 2) = 124.70
UPDATE public.factory_pricing
SET price_per_bottle = 124.7 / 1.05 / 20
WHERE sku = 'P 500 ml'
  AND pricing_date = '2026-05-01';

-- Step 3: Verify the fix
SELECT sku, pricing_date, price_per_bottle, tax, bottles_per_case, cost_per_case
FROM public.factory_pricing
WHERE sku = 'P 500 ml'
ORDER BY pricing_date DESC;

-- Step 4: Backfill all factory_payables production amounts against updated pricing
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
