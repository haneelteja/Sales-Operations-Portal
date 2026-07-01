-- Fix December 2025 transport_expenses discrepancies vs Elma ledger (2026-07-01).

-- Fix 1: Intercity-Bachupally 12/20 — amount ₹800→₹600.
UPDATE public.transport_expenses SET amount = 600.00
WHERE id = '3dc7a5d7-2146-4940-b0ad-b26e26c0d2ea';

-- Fix 2: Intercity-Bachupally 12/28 — amount ₹800→₹1,000.
UPDATE public.transport_expenses SET amount = 1000.00
WHERE id = '9a0def4b-901a-436f-8eae-008612b00424';

-- Fix 3: Biryanis and More, Chandha Nagar 12/28 — amount ₹0→₹1,500.
UPDATE public.transport_expenses SET amount = 1500.00
WHERE id = 'a74d2c59-0c0f-45fa-a449-1ba408c9b08d';

-- Fix 4: Golden Pavilion 12/31 — amount ₹500→₹700.
UPDATE public.transport_expenses SET amount = 700.00
WHERE id = '8e6504b0-6b97-47cf-ac65-b186a062229f';

-- Delete 1: Spurious extra Intercity-Bachupally 12/24 — not in Elma ledger.
DELETE FROM public.transport_expenses
WHERE id = '9c3d27df-08f1-4aca-8401-7c51e3b094b7';

-- Insert 1: Intercity-Bachupally 12/3 — missing ₹800 transport.
INSERT INTO public.transport_expenses (expense_date, description, amount)
SELECT '2025-12-03', 'Intercity Bachupally transport', 800.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE expense_date = '2025-12-03' AND description = 'Intercity Bachupally transport'
);

-- Insert 2: Intercity-Bachupally 12/4 — missing ₹800 transport.
INSERT INTO public.transport_expenses (expense_date, description, amount)
SELECT '2025-12-04', 'Intercity Bachupally transport', 800.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE expense_date = '2025-12-04' AND description = 'Intercity Bachupally transport'
);

-- Insert 3: Intercity-Bachupally 12/8 — missing second ₹800 transport (two runs that day).
INSERT INTO public.transport_expenses (expense_date, description, amount)
SELECT '2025-12-08', 'Intercity Bachupally transport', 800.00
WHERE (
  SELECT COUNT(*) FROM public.transport_expenses
  WHERE expense_date = '2025-12-08' AND description = 'Intercity Bachupally transport'
) < 2;

-- Insert 4: Intercity-Bachupally 12/10 — missing ₹1,000 transport.
INSERT INTO public.transport_expenses (expense_date, description, amount)
SELECT '2025-12-10', 'Intercity Bachupally transport', 1000.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE expense_date = '2025-12-10' AND description = 'Intercity Bachupally transport'
);

-- Insert 5: Intercity-Bachupally 12/26 — missing ₹800 transport.
INSERT INTO public.transport_expenses (expense_date, description, amount)
SELECT '2025-12-26', 'Intercity Bachupally transport', 800.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE expense_date = '2025-12-26' AND description = 'Intercity Bachupally transport'
);
