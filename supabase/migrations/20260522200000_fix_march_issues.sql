-- Fix two March 2026 data issues:
--
-- 1. P 1000 ml 2026-03-10 price: 120.40 → 120.43
--    Same pattern as Oct 2025 fix (101.40→101.43): our migration used .40
--    but reference data consistently shows .43 across all March dates.
--
-- 2. Alley 91 3/13 SKU error: P 250 ml → 250 EC (same error as 1/27)
--    Reference shows 40 cases in "Elma Cust 250" column = 40 × 108 = 4320
--    Portal logged as P 250 ml (113.40) = 4536. Diff = +216.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Fix P 1000 ml March 2026 price
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.factory_pricing
SET price_per_bottle = 120.43 / (1.05 * 12)
WHERE sku          = 'P 1000 ml'
  AND pricing_date = '2026-03-10';

-- Confirm cost_per_case is now 120.43
SELECT sku, pricing_date, price_per_bottle, cost_per_case
FROM public.factory_pricing
WHERE sku = 'P 1000 ml'
ORDER BY pricing_date;

-- Backfill factory_payables for all P 1000 ml production rows
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

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Fix Alley 91 3/13 SKU error: P 250 ml → 250 EC
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_alley91_250ec_id uuid;
  v_fp_id            uuid;
BEGIN
  SELECT id INTO v_alley91_250ec_id
  FROM public.customers
  WHERE client_name = 'Alley 91'
    AND branch      = 'Nanakramguda'
    AND sku         = '250 EC'
  LIMIT 1;

  IF v_alley91_250ec_id IS NULL THEN
    RAISE EXCEPTION 'No customer config found for Alley 91 + Nanakramguda + 250 EC';
  END IF;

  SELECT fp.id INTO v_fp_id
  FROM public.factory_payables fp
  JOIN public.customers c ON c.id = fp.customer_id
  WHERE fp.transaction_date::date = '2026-03-13'
    AND fp.transaction_type       = 'production'
    AND fp.sku                    = 'P 250 ml'
    AND fp.quantity               = 40
    AND c.client_name             = 'Alley 91'
    AND c.branch                  = 'Nanakramguda';

  IF v_fp_id IS NULL THEN
    RAISE EXCEPTION 'Target factory_payables row not found — already fixed or data changed';
  END IF;

  UPDATE public.factory_payables
  SET sku         = '250 EC',
      amount      = 4320.00,
      customer_id = v_alley91_250ec_id
  WHERE id = v_fp_id;

  RAISE NOTICE 'Fixed: row % updated from P 250 ml (4536) → 250 EC (4320)', v_fp_id;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Verify March problem dates
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  fp.transaction_date::date AS tx_date,
  c.client_name,
  fp.sku,
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
WHERE fp.transaction_type = 'production'
  AND fp.transaction_date::date BETWEEN '2026-03-01' AND '2026-03-31'
  AND fp.sku IN ('P 1000 ml', '250 EC', 'P 250 ml')
ORDER BY fp.transaction_date::date, fp.sku;
