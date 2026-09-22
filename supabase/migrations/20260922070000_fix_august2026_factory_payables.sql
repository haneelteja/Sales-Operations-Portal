-- Fix August 2026 factory_payables discrepancies found during Elma reconciliation.
--
-- Summary of changes:
--   PAYMENT: 8/25 Labels Amount ₹5,000 missing from portal
--   PRODUCTION ADD: 8/3 SoS Financial District (+42 cases)
--   PRODUCTION ADD: 8/21 Benguluru Bhavan damaged (−15 cases)
--   PRODUCTION ADD: 8/23 Golden Pavilion (+50 cases)
--   PRODUCTION ADD: 8/25 Hiyya Dino Mandi damaged (−13 cases)
--   PRODUCTION ADD: 8/31 Alley 91 250ml (+22 cases)
--   PRODUCTION ADD: 8/31 Hiyya Dino Mandi damaged (−10 cases)
--   PRODUCTION DELETE: 8/2 Illuzion EL 250ml 10 cases (not in Elma)
--   PRODUCTION DELETE: 8/26 Illuzion EL 250ml 30 cases (not in Elma)
--   PRODUCTION FIX: 8/26 Illuzion 20 cases EL 250ml → P 250ml (wrong SKU + price)
--
-- Net result: cases 4218 → 4254, net outstanding 250639 → 248831 (matches Elma)

-- ── 1. Add missing payment: 8/25 Labels Amount ────────────────────────────────
INSERT INTO public.factory_payables (transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '2026-08-25', 'payment', NULL, NULL, 5000.00, 'Labels Amount'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-08-25'
    AND transaction_type = 'payment'
    AND amount = 5000.00
    AND description = 'Labels Amount'
);

-- ── 2. Add soul of south Financial District 8/3 ───────────────────────────────
INSERT INTO public.factory_payables (transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '2026-08-03', 'production', 'P 500 ml', 42, 5237.40, 'Shortfall from sale — Soul of South Financial District'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-08-03'
    AND transaction_type = 'production'
    AND sku = 'P 500 ml'
    AND quantity = 42
);

-- ── 3. Add Benguluru Bhavan damaged bottles 8/21 ─────────────────────────────
INSERT INTO public.factory_payables (transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '2026-08-21', 'production', 'P 500 ml', -15, -1870.50, 'Damaged Bottles — Benguluru Bhavan'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-08-21'
    AND transaction_type = 'production'
    AND quantity = -15
);

-- ── 4. Add Golden Pavilion 8/23 ───────────────────────────────────────────────
INSERT INTO public.factory_payables (transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '2026-08-23', 'production', 'AL 750 ml', 50, 4410.00, 'Golden Pavilion'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-08-23'
    AND transaction_type = 'production'
    AND sku = 'AL 750 ml'
    AND quantity = 50
);

-- ── 5. Add Hiyya Dino Mandi damaged 8/25 ─────────────────────────────────────
INSERT INTO public.factory_payables (transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '2026-08-25', 'production', 'P 500 ml', -13, -1621.10, 'Damaged Bottles — Hiyya Dino Mandi'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-08-25'
    AND transaction_type = 'production'
    AND quantity = -13
);

-- ── 6. Add Alley 91 250ml 8/31 ────────────────────────────────────────────────
INSERT INTO public.factory_payables (transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '2026-08-31', 'production', 'P 250 ml', 22, 2494.80, 'Shortfall from sale — Alley 91'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-08-31'
    AND transaction_type = 'production'
    AND sku = 'P 250 ml'
    AND quantity = 22
);

-- ── 7. Add Hiyya Dino Mandi damaged 8/31 ─────────────────────────────────────
INSERT INTO public.factory_payables (transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '2026-08-31', 'production', 'P 500 ml', -10, -1247.00, 'Damaged Bottles — Hiyya Dino Mandi'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-08-31'
    AND transaction_type = 'production'
    AND quantity = -10
);

-- ── 8. Delete extra Illuzion EL 250ml 8/2 (not in Elma) ──────────────────────
DELETE FROM public.factory_payables
WHERE transaction_date = '2026-08-02'
  AND transaction_type = 'production'
  AND sku = 'EL 250 ml'
  AND quantity = 10
  AND description = 'Illuzion';

-- ── 9. Delete extra Illuzion EL 250ml 30 cases 8/26 (not in Elma) ────────────
DELETE FROM public.factory_payables
WHERE transaction_date = '2026-08-26'
  AND transaction_type = 'production'
  AND sku = 'EL 250 ml'
  AND quantity = 30
  AND description = 'Illuzion';

-- ── 10. Fix Illuzion 8/26 20-case entry: EL 250ml → P 250ml ──────────────────
-- Elma records this as P 250ml (₹113.40/case × 20 = ₹2,268), not EL 250ml (₹108/case)
UPDATE public.factory_payables
SET sku = 'P 250 ml', amount = 2268.00
WHERE transaction_date = '2026-08-26'
  AND transaction_type = 'production'
  AND sku = 'EL 250 ml'
  AND quantity = 20
  AND description = 'Illuzion';
