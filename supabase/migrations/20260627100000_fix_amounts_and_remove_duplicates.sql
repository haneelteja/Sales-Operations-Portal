-- Fix 1: Recalculate all production amounts using effective pricing (LATERAL join).
-- The revert migration incorrectly set all rows to latest pricing regardless of date.
-- This restores correct amounts: qty × cost_per_case where pricing_date <= transaction_date.

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

-- Fix 2: Remove duplicate production rows.
-- Duplicates arose because the Elma-inserted rows (different description format)
-- bypassed the NOT EXISTS guard on original portal rows with different descriptions.
-- Strategy: for each group sharing (transaction_date, customer_id, sku, quantity,
-- transaction_type), keep the row with the LOWEST id (the original portal entry)
-- and delete the newer duplicates.
-- customer_id IS NULL rows are grouped separately using COALESCE.

DELETE FROM public.factory_payables
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY
          transaction_date::date,
          COALESCE(customer_id::text, '___null___'),
          sku,
          quantity,
          transaction_type
        ORDER BY id ASC
      ) AS rn
    FROM public.factory_payables
    WHERE transaction_type = 'production'
  ) ranked
  WHERE rn > 1
);
