-- Correct factory_pricing rows to match verified price list.
-- cost_per_case is GENERATED as ROUND(price_per_bottle * (1 + tax/100) * bottles_per_case, 2)
-- so we set price_per_bottle; DB computes cost_per_case automatically.
-- Tax: 18% before Oct 2025, 5% from Oct 2025 onwards (matches existing rows).
--
-- Changes:
--  1. Move 5 SKUs from 2025-03-01 → 2025-01-01 (AL 500, AL 750, 1000 EC, 250 EC, EL 500)
--  2. Fix price_per_bottle where cost_per_case was slightly off
--  3. Delete erroneous P 750 ml 2025-03-01 row
--  4. Full backfill of factory_payables to apply corrected prices correctly

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Move 2025-03-01 rows → 2025-01-01 and fix prices where needed
-- ─────────────────────────────────────────────────────────────────────────────

-- 1000 EC: date only (106.20 correct, ppb=7.50 correct)
UPDATE public.factory_pricing
SET pricing_date = '2025-01-01'
WHERE sku = '1000 EC' AND pricing_date = '2025-03-01';

-- 250 EC: date only (148.68 correct, ppb=3.60 correct)
UPDATE public.factory_pricing
SET pricing_date = '2025-01-01'
WHERE sku = '250 EC' AND pricing_date = '2025-03-01';

-- AL 750 ml: date only (99.12 correct, ppb=7.00 correct)
UPDATE public.factory_pricing
SET pricing_date = '2025-01-01'
WHERE sku = 'AL 750 ml' AND pricing_date = '2025-03-01';

-- AL 500 ml: date + value (122.77 → 122.72; ppb = 122.72 / (1.18 * 12))
UPDATE public.factory_pricing
SET pricing_date    = '2025-01-01',
    price_per_bottle = 122.72 / (1.18 * 12)
WHERE sku = 'AL 500 ml' AND pricing_date = '2025-03-01';

-- EL 500 ml: date + value (113.30 → 113.28; ppb = 113.28 / (1.18 * 20) = 4.8 exactly)
UPDATE public.factory_pricing
SET pricing_date     = '2025-01-01',
    price_per_bottle = 4.8
WHERE sku = 'EL 500 ml' AND pricing_date = '2025-03-01';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Fix P 1000 ml 2025-01-01: 113.99 → 114.00
--    ppb = 114.0 / (1.18 * 12)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.factory_pricing
SET price_per_bottle = 114.0 / (1.18 * 12)
WHERE sku = 'P 1000 ml' AND pricing_date = '2025-01-01';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Fix P 500 ml 2025-01-01: 122.72 → 122.70
--    ppb = 122.7 / (1.18 * 20)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.factory_pricing
SET price_per_bottle = 122.7 / (1.18 * 20)
WHERE sku = 'P 500 ml' AND pricing_date = '2025-01-01';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Fix 2025-10-01 values (5% tax)
-- ─────────────────────────────────────────────────────────────────────────────

-- 250 EC: 108.05 → 108.00; ppb = 108 / (1.05 * 35)
UPDATE public.factory_pricing
SET price_per_bottle = 108.0 / (1.05 * 35)
WHERE sku = '250 EC' AND pricing_date = '2025-10-01';

-- EL 250 ml: 108.05 → 108.00; ppb = 108 / (1.05 * 35)
UPDATE public.factory_pricing
SET price_per_bottle = 108.0 / (1.05 * 35)
WHERE sku = 'EL 250 ml' AND pricing_date = '2025-10-01';

-- P 1000 ml: 101.43 → 101.40; ppb = 101.4 / (1.05 * 12)
UPDATE public.factory_pricing
SET price_per_bottle = 101.4 / (1.05 * 12)
WHERE sku = 'P 1000 ml' AND pricing_date = '2025-10-01';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Fix 2026-03-10 values (5% tax)
-- ─────────────────────────────────────────────────────────────────────────────

-- P 500 ml: 127.26 → 127.20; ppb = 127.2 / (1.05 * 20)
UPDATE public.factory_pricing
SET price_per_bottle = 127.2 / (1.05 * 20)
WHERE sku = 'P 500 ml' AND pricing_date = '2026-03-10';

-- P 1000 ml: 120.46 → 120.40; ppb = 120.4 / (1.05 * 12)
UPDATE public.factory_pricing
SET price_per_bottle = 120.4 / (1.05 * 12)
WHERE sku = 'P 1000 ml' AND pricing_date = '2026-03-10';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Fix 2026-05-01 values (5% tax)
-- ─────────────────────────────────────────────────────────────────────────────

-- P 1000 ml: 117.94 → 117.90; ppb = 117.9 / (1.05 * 12)
UPDATE public.factory_pricing
SET price_per_bottle = 117.9 / (1.05 * 12)
WHERE sku = 'P 1000 ml' AND pricing_date = '2026-05-01';

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Delete erroneous P 750 ml 2025-03-01 row
--    (88.20 price is already correctly set from 2025-10-01 onwards)
-- ─────────────────────────────────────────────────────────────────────────────
DELETE FROM public.factory_pricing
WHERE sku = 'P 750 ml' AND pricing_date = '2025-03-01';

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Full backfill: recalculate all factory_payables production amounts
--    using LATERAL join to pick the correct pricing row per transaction date.
--    The row-level trigger uses NEW.price_per_case for all future dates which
--    is incorrect when multiple pricing periods exist — this backfill corrects that.
-- ─────────────────────────────────────────────────────────────────────────────
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
SET amount = c.correct_amount
FROM corrections c
WHERE fp.id = c.id
  AND fp.amount IS DISTINCT FROM c.correct_amount;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Verify: show final factory_pricing table
-- ─────────────────────────────────────────────────────────────────────────────
SELECT sku, pricing_date, price_per_bottle, bottles_per_case, cost_per_case
FROM public.factory_pricing
ORDER BY sku, pricing_date;
