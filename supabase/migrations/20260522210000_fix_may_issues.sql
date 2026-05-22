-- Fix two May 2026 data issues:
--
-- 1. P 1000 ml 2026-05-01 price: 117.90 → 117.93
--    Same .40→.43 pattern as Oct 2025 (101.43) and Mar 2026 (120.43).
--    Reference: B&M Ongole 315×117.93=37147.95≈37148, Element E7 108×117.93=12736.44≈12736 ✓
--
-- 2. B&M Gachibowli 5/14 SKU error: P 1000 ml → P 500 ml
--    Reference shows 70×124.70=8729 in P 500 ml column; portal logged as P 1000 ml (8253).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Fix P 1000 ml May 2026 price
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.factory_pricing
SET price_per_bottle = 117.93 / (1.05 * 12)
WHERE sku          = 'P 1000 ml'
  AND pricing_date = '2026-05-01';

-- Confirm cost_per_case is now 117.93
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
-- 2. Fix B&M Gachibowli 5/14 SKU error: P 1000 ml → P 500 ml
--    No P 500 ml customer config exists for this branch, so customer_id stays
--    pointing to the Gachibowli P 1000 ml config (identifies the client/branch).
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_fp_id uuid;
BEGIN
  SELECT fp.id INTO v_fp_id
  FROM public.factory_payables fp
  JOIN public.customers c ON c.id = fp.customer_id
  WHERE fp.transaction_date::date = '2026-05-14'
    AND fp.transaction_type       = 'production'
    AND fp.sku                    = 'P 1000 ml'
    AND fp.quantity               = 70
    AND c.client_name             = 'Biryanis and More'
    AND c.branch                  = 'Gachibowli';

  IF v_fp_id IS NULL THEN
    RAISE EXCEPTION 'Target factory_payables row not found — already fixed or data changed';
  END IF;

  UPDATE public.factory_payables
  SET sku    = 'P 500 ml',
      amount = 8729.00
  WHERE id = v_fp_id;

  RAISE NOTICE 'Fixed: row % updated from P 1000 ml (8253) → P 500 ml (8729)', v_fp_id;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Verify May problem dates
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
  AND fp.transaction_date::date BETWEEN '2026-05-01' AND '2026-05-31'
  AND fp.sku IN ('P 1000 ml', 'P 500 ml')
ORDER BY fp.transaction_date::date, fp.sku, c.client_name;
