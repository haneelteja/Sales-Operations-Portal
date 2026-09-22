-- Fix three July 2026 factory_payables discrepancies found during Elma reconciliation:
--   1. Illuzion EL 250ml Jul 24 — portal had 40 cases, Elma shows 50
--   2. Element E7 Jul 31 — 105 cases completely missing from portal
--   3. Return stock Jul 31 — Ballus Kitchen −₹1,500 not entered

-- 1. Fix Illuzion EL 250 ml Jul 24: 40 → 50 cases, 4320 → 5400
UPDATE public.factory_payables
SET quantity = 50, amount = 5400.00
WHERE transaction_date = '2026-07-24'
  AND sku = 'EL 250 ml'
  AND transaction_type = 'production';

-- 2. Add Element E7 Jul 31 — 105 cases P 1000 ml (was never entered)
INSERT INTO public.factory_payables (transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '2026-07-31', 'production', 'P 1000 ml', 105, 12382.65, 'Shortfall from sale — Element E7'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-07-31'
    AND sku = 'P 1000 ml'
    AND quantity = 105
    AND transaction_type = 'production'
    AND description = 'Shortfall from sale — Element E7'
);

-- 3. Add return stock Jul 31 — Ballus Kitchen transport credit
INSERT INTO public.factory_payables (transaction_date, transaction_type, sku, quantity, amount, description)
SELECT '2026-07-31', 'production', NULL, 0, -1500.00, 'Return stock — Ballus Kitchen'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_date = '2026-07-31'
    AND amount = -1500.00
    AND transaction_type = 'production'
    AND description = 'Return stock — Ballus Kitchen'
);
