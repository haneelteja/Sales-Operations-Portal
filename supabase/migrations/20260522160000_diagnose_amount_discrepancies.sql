-- Diagnose discrepancies between Elma Operations reference and factory_payables amounts.
-- Two categories:
--   A) Small (-1 to -10): rounding of cost_per_case (ROUND to 2 decimals per case)
--   B) Large (±20+): wrong pricing period, wrong quantity, or wrong payment amount

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. All transactions on dates with LARGE discrepancies
--    Focus dates: 1/6, 1/7, 1/27, 3/12, 3/13, 3/24, 4/28, 5/14 (2026)
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  fp.transaction_date::date                              AS tx_date,
  fp.transaction_type,
  fp.sku,
  fp.quantity,
  fp.amount,
  -- For production: what pricing row was picked?
  pr.pricing_date                                        AS pricing_period,
  pr.cost_per_case                                       AS cost_per_case_used,
  ROUND((fp.quantity * pr.cost_per_case)::numeric, 2)   AS recalc_amount,
  fp.amount - ROUND((fp.quantity * pr.cost_per_case)::numeric, 2) AS drift,
  fp.description,
  c.client_name,
  c.branch
FROM public.factory_payables fp
LEFT JOIN LATERAL (
  SELECT pricing_date, cost_per_case
  FROM public.factory_pricing
  WHERE sku          = fp.sku
    AND pricing_date <= fp.transaction_date::date
  ORDER BY pricing_date DESC
  LIMIT 1
) pr ON fp.transaction_type = 'production'
LEFT JOIN public.customers c ON c.id = fp.customer_id
WHERE fp.transaction_date::date IN (
  '2026-01-06', '2026-01-07',
  '2026-01-27',
  '2026-03-12', '2026-03-13', '2026-03-24',
  '2026-04-28',
  '2026-05-14'
)
ORDER BY fp.transaction_date::date, fp.transaction_type, fp.sku;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Daily totals for ALL dates — compare amounts by type
--    This shows if the issue is in production rows or payment rows
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  transaction_date::date                         AS tx_date,
  transaction_type,
  COUNT(*)                                       AS tx_count,
  ROUND(SUM(amount)::numeric, 2)                 AS total_amount,
  SUM(quantity)                                  AS total_qty
FROM public.factory_payables
WHERE transaction_date::date IN (
  '2026-01-06', '2026-01-07',
  '2026-01-27',
  '2026-03-12', '2026-03-13', '2026-03-24',
  '2026-04-28',
  '2026-05-14'
)
GROUP BY transaction_date::date, transaction_type
ORDER BY transaction_date::date, transaction_type;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Rounding analysis: compare current amount vs unrounded calculation
--    for ALL production rows — shows systematic undershoot pattern
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  fp.transaction_date::date                                           AS tx_date,
  fp.sku,
  fp.quantity,
  fp.amount                                                           AS stored_amount,
  -- Unrounded per-case price * qty (no ROUND on cost_per_case)
  ROUND((fp.quantity * fp_pricing.price_per_bottle
         * (1 + COALESCE(fp_pricing.tax, 0) / 100.0)
         * fp_pricing.bottles_per_case)::numeric, 2)                  AS unrounded_case_amount,
  fp.amount - ROUND((fp.quantity * fp_pricing.price_per_bottle
                     * (1 + COALESCE(fp_pricing.tax, 0) / 100.0)
                     * fp_pricing.bottles_per_case)::numeric, 2)       AS rounding_drift
FROM public.factory_payables fp
JOIN LATERAL (
  SELECT price_per_bottle, tax, bottles_per_case
  FROM public.factory_pricing
  WHERE sku          = fp.sku
    AND pricing_date <= fp.transaction_date::date
  ORDER BY pricing_date DESC
  LIMIT 1
) fp_pricing ON true
WHERE fp.transaction_type = 'production'
  AND fp.quantity IS NOT NULL
  AND fp.amount != ROUND((fp.quantity * fp_pricing.price_per_bottle
                          * (1 + COALESCE(fp_pricing.tax, 0) / 100.0)
                          * fp_pricing.bottles_per_case)::numeric, 2)
ORDER BY ABS(fp.amount - ROUND((fp.quantity * fp_pricing.price_per_bottle
                                * (1 + COALESCE(fp_pricing.tax, 0) / 100.0)
                                * fp_pricing.bottles_per_case)::numeric, 2)) DESC
LIMIT 50;
