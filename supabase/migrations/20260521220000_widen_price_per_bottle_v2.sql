-- Cannot ALTER type of price_per_bottle while cost_per_case generated column references it.
-- Solution: drop cost_per_case first, widen price_per_bottle, re-add generated column.

-- Step 1: Drop the generated column
ALTER TABLE public.factory_pricing DROP COLUMN cost_per_case;

-- Step 2: Widen price_per_bottle to NUMERIC (removes the DECIMAL(10,2) truncation)
ALTER TABLE public.factory_pricing
  ALTER COLUMN price_per_bottle TYPE NUMERIC;

-- Step 3: Re-add cost_per_case as generated column with ROUND to 2 dp
ALTER TABLE public.factory_pricing
  ADD COLUMN cost_per_case NUMERIC GENERATED ALWAYS AS (
    ROUND((price_per_bottle * (1 + COALESCE(tax, 0) / 100.0) * bottles_per_case)::numeric, 2)
  ) STORED;

-- Step 4: Set price_per_bottle precisely for P 500 ml 2026-05-01
--   124.7 / 1.05 / 20 = 5.938095238...
--   ROUND(5.938095... * 1.05 * 20, 2) = 124.70
UPDATE public.factory_pricing
SET price_per_bottle = 124.7 / 1.05 / 20
WHERE sku = 'P 500 ml'
  AND pricing_date = '2026-05-01';

-- Step 5: Verify
SELECT sku, pricing_date, price_per_bottle, tax, bottles_per_case, cost_per_case
FROM public.factory_pricing
WHERE sku = 'P 500 ml'
ORDER BY pricing_date DESC;

-- Step 6: Backfill all factory_payables production amounts
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
