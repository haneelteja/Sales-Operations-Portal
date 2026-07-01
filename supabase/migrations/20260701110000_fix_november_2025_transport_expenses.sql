-- Fix November 2025 transport_expenses discrepancies vs Elma ledger (2026-07-01).

-- Fix 1: Biryanis and More, Chandha Nagar 11/19 — amount ₹0→₹700.
UPDATE public.transport_expenses
SET amount = 700.00
WHERE id = '84e1b854-8bfe-4dd8-b8a1-e7c5ae648e00';

-- Insert 1: Intercity-Bachupally 11/10 — missing ₹700 transport.
INSERT INTO public.transport_expenses (expense_date, description, amount)
SELECT '2025-11-10', 'Intercity Bachupally transport', 700.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE expense_date = '2025-11-10' AND description = 'Intercity Bachupally transport'
);

-- Insert 2: Intercity-Bachupally 11/24 — missing ₹800 transport.
INSERT INTO public.transport_expenses (expense_date, description, amount)
SELECT '2025-11-24', 'Intercity Bachupally transport', 800.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE expense_date = '2025-11-24' AND description = 'Intercity Bachupally transport'
);

-- Insert 3: Intercity-Bachupally 11/29 — missing ₹800 transport.
INSERT INTO public.transport_expenses (expense_date, description, amount)
SELECT '2025-11-29', 'Intercity Bachupally transport', 800.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE expense_date = '2025-11-29' AND description = 'Intercity Bachupally transport'
);
