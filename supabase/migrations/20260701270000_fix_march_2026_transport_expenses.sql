-- Fix March 2026 transport_expenses discrepancies vs Elma ledger (2026-07-01).

-- Delete 1: Duplicate Biryanis and More-Ongole 3/24 (₹9,000) — second of two identical entries.
DELETE FROM public.transport_expenses WHERE id = '68b205a0-19f5-489f-b83b-a716ffe40bf5';

-- Delete 2: Duplicate Biryanis and More-Khammam 3/24 (₹7,500) — second of two identical entries.
DELETE FROM public.transport_expenses WHERE id = 'd1127d12-7f77-43b2-9e0b-5bc85f8ba30d';

-- Delete 3: Extra Biryanis and More-Tirumalagiri 3/12 ₹0 entry — not in Elma, no financial impact.
DELETE FROM public.transport_expenses WHERE id = 'd160f2fd-9fb8-49cd-8adc-cce6dc1ff85f';

-- Insert 1: Missing Benguluru Bhavan 3/4 transport ₹1,100.
INSERT INTO public.transport_expenses (expense_date, description, amount)
SELECT '2026-03-04', 'Benguluru Bhavan Transport', 1100.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE expense_date = '2026-03-04' AND description = 'Benguluru Bhavan Transport'
);

-- Insert 2: Missing Gismat-Ameerpet 3/12 transport ₹600.
INSERT INTO public.transport_expenses (expense_date, description, amount)
SELECT '2026-03-12', 'Gismat-Ameerpet Transport', 600.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE expense_date = '2026-03-12' AND description = 'Gismat-Ameerpet Transport'
);
