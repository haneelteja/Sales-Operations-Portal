-- Recalculate factory_payables production amounts for all 710 rows.
-- Uses LATERAL join to pick the effective factory_pricing row
-- (latest pricing_date <= transaction_date) per SKU per transaction.
-- Only updates rows where the stored amount differs from the correct value.

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
    AND fp.quantity IS NOT NULL
    AND fp.sku IS NOT NULL
)
UPDATE public.factory_payables fp
SET    amount = c.correct_amount
FROM   corrections c
WHERE  fp.id = c.id
  AND  fp.amount IS DISTINCT FROM c.correct_amount;

-- Show what was corrected (rows with changed amounts appear in this result)
SELECT
  fp.transaction_date::date AS date,
  fp.sku,
  fp.quantity,
  pr.cost_per_case AS price_per_case,
  ROUND((fp.quantity * pr.cost_per_case)::numeric, 2) AS correct_amount,
  fp.amount AS stored_amount
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
  AND fp.quantity IS NOT NULL
  AND fp.sku IS NOT NULL
ORDER BY fp.transaction_date, fp.sku;
