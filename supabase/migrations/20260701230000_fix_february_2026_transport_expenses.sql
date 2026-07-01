-- Fix February 2026 transport_expenses discrepancies vs Elma ledger (2026-07-01).

-- Fix 1: Chaitanya's Modern Kitchen 2/21 labour entry — description says Transport, should be Labour.
UPDATE public.transport_expenses
SET description = 'Chaitanya''s Modern Kitchen Labour'
WHERE id = '20d9eb61-7f5a-40b5-98f6-f9de894622e6';

-- Insert 1: This is It café 2/28 — missing ₹300 transport.
INSERT INTO public.transport_expenses (expense_date, description, amount)
SELECT '2026-02-28', 'This is It café Transport', 300.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE expense_date = '2026-02-28' AND description = 'This is It café Transport'
);
