-- Fix May 2026 transport_expenses discrepancies vs Elma ledger (2026-07-01).

-- Insert 1: Missing Elma 250ml Transport 5/28 (₹1,200).
INSERT INTO public.transport_expenses (expense_date, description, amount)
SELECT '2026-05-28', 'Elma 250ml Transport', 1200.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE expense_date = '2026-05-28' AND description = 'Elma 250ml Transport'
);
