-- Fix June 2025 transport_expenses discrepancies vs Elma ledger (2026-06-30).

-- Fix 1: Tilaks kitchen 6/21 — typo ₹10,700→₹1,070 (extra zero).
UPDATE public.transport_expenses
SET amount = 1070.00
WHERE id = 'd8d3bd8e-559b-4d5b-9a4f-ade7cb607260';

-- Insert 1: Missing Labels Transport 6/16 ₹550.
INSERT INTO public.transport_expenses (expense_date, description, amount, expense_group)
SELECT '2025-06-16', 'Labels Transport', 550.00, 'labels'
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE expense_date = '2025-06-16' AND description = 'Labels Transport' AND amount = 550.00
);

-- Insert 2: Missing Labels Transport 6/25 ₹300.
INSERT INTO public.transport_expenses (expense_date, description, amount, expense_group)
SELECT '2025-06-25', 'Labels Transport', 300.00, 'labels'
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE expense_date = '2025-06-25' AND description = 'Labels Transport' AND amount = 300.00
);

-- Insert 3: Missing Biryanis and More, Gachibowli Transport 6/25 ₹1,370.
INSERT INTO public.transport_expenses (client_id, expense_date, description, amount, expense_group)
SELECT '8ea3202d-2fab-478a-9ca3-390cbd17f4fe', '2025-06-25', 'Biryanis and More-Gachibowli Transport', 1370.00, 'Client Sale Transport'
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE client_id = '8ea3202d-2fab-478a-9ca3-390cbd17f4fe'
    AND expense_date = '2025-06-25' AND amount = 1370.00
);
