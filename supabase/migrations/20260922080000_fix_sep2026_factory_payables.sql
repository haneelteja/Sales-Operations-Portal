-- Fix September 2026 factory_payables discrepancies found during Elma reconciliation.
-- Covers entries through 2026-09-21 (month still in progress).
--
-- Summary:
--   ADD  9/1  Illuzion El-250ml: 30 cases P 250ml missing from portal
--   FIX  9/10 Hiyya Dino Mandi: portal has 105 cases, Elma shows 120
--   FIX  9/13 Benguluru Bhavan: portal has 135 cases, Elma shows 140
--   FIX  9/16 SSKL kalamandir:  portal has 268 cases, Elma shows 265
--   DEL  9/1  Alley 91 P 250ml 22 cases: not in Elma, spurious entry
--
-- Net: cases 2056 → 2081, net outstanding -27213.30 → -24152.30 (matches Elma)

-- ── 1. Add Illuzion El-250ml 9/1 ──────────────────────────────────────────────
INSERT INTO public.factory_payables (transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '2026-09-01', 'production', 'P 250 ml', 30, 3402.00, 'Illuzion El-250ml'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-09-01'
    AND transaction_type = 'production'
    AND sku = 'P 250 ml'
    AND quantity = 30
);

-- ── 2. Fix Hiyya Dino Mandi 9/10: 105 → 120 cases ────────────────────────────
UPDATE public.factory_payables
SET quantity = 120, amount = 14964.00
WHERE transaction_date = '2026-09-10'
  AND transaction_type = 'production'
  AND sku = 'P 500 ml'
  AND quantity = 105
  AND description = 'Shortfall from sale — Hiyya Dino Mandi';

-- ── 3. Fix Benguluru Bhavan 9/13: 135 → 140 cases ────────────────────────────
UPDATE public.factory_payables
SET quantity = 140, amount = 17458.00
WHERE transaction_date = '2026-09-13'
  AND transaction_type = 'production'
  AND sku = 'P 500 ml'
  AND quantity = 135
  AND description = 'Shortfall from sale — Benguluru Bhavan';

-- ── 4. Fix SSKL kalamandir 9/16: 268 → 265 cases ─────────────────────────────
UPDATE public.factory_payables
SET quantity = 265, amount = 30051.00
WHERE transaction_date = '2026-09-16'
  AND transaction_type = 'production'
  AND sku = 'P 250 ml'
  AND quantity = 268
  AND description = 'SSKL';

-- ── 5. Delete spurious Alley 91 P 250ml 9/1 (not in Elma) ───────────────────
DELETE FROM public.factory_payables
WHERE transaction_date = '2026-09-01'
  AND transaction_type = 'production'
  AND sku = 'P 250 ml'
  AND quantity = 22
  AND description = 'Alley 91';
