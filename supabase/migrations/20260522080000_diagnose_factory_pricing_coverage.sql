-- Find SKUs used in factory_payables (production type) that have NO factory_pricing row
-- covering the transaction date (i.e. no pricing_date <= transaction_date).
SELECT DISTINCT
  fp.sku,
  fp.transaction_date::date AS production_date,
  fp.quantity,
  fp.amount
FROM public.factory_payables fp
WHERE fp.transaction_type = 'production'
  AND fp.sku IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.factory_pricing pr
    WHERE pr.sku = fp.sku
      AND pr.pricing_date <= fp.transaction_date::date
  )
ORDER BY fp.sku, fp.transaction_date;
