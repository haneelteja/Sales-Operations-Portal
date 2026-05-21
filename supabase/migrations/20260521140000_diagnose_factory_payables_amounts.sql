-- STEP 4 DIAGNOSTIC: Verify factory_payables production amounts match
-- the correct pricing for each transaction date.
--
-- For each production row we find the applicable factory_pricing record
-- (latest pricing_date <= transaction_date for that SKU) and compare
-- stored amount vs expected amount (quantity * cost_per_case).
-- Rows where they differ are flagged as mismatches.

SELECT
  fp.id,
  fp.sku,
  fp.transaction_date::date                          AS txn_date,
  fp.quantity,
  fp.amount                                          AS stored_amount,
  pr.pricing_date                                    AS applied_pricing_date,
  pr.price_per_bottle,
  pr.tax,
  pr.cost_per_case                                   AS pricing_cost_per_case,
  ROUND((fp.quantity * pr.cost_per_case)::numeric, 4) AS expected_amount,
  CASE
    WHEN ABS(fp.amount - fp.quantity * pr.cost_per_case) < 0.01
    THEN 'OK'
    ELSE '*** MISMATCH ***'
  END                                                AS status
FROM public.factory_payables fp
JOIN LATERAL (
  SELECT pricing_date, price_per_bottle, tax, cost_per_case
  FROM public.factory_pricing
  WHERE sku = fp.sku
    AND pricing_date <= fp.transaction_date::date
  ORDER BY pricing_date DESC
  LIMIT 1
) pr ON true
WHERE fp.transaction_type = 'production'
  AND fp.quantity IS NOT NULL
ORDER BY fp.sku, fp.transaction_date;
