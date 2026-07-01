-- Fix June 2026 transport_expenses discrepancies vs Elma ledger (2026-07-01).

-- Fix 1: Chaitanya's Modern Kitchen 6/10 transport — DB ₹1,200 should be ₹1,100.
UPDATE public.transport_expenses SET amount = 1100.00 WHERE id = 'e71f3776-c5df-47f9-be9c-cd6569feed65';

-- Fix 2-5: 6/26 entries entered as ₹0 placeholders — fill in actual amounts.
UPDATE public.transport_expenses SET amount = 800.00  WHERE id = '3f08f1c6-0272-4509-a982-90a2a1e57cf7'; -- Benguluru Bhavan
UPDATE public.transport_expenses SET amount = 1200.00 WHERE id = 'd8de3c53-f664-42f9-8933-cdf1ab34f3ca'; -- Element E7
UPDATE public.transport_expenses SET amount = 600.00  WHERE id = 'c4c8c03a-3303-40c1-9142-b1c8d9eec17a'; -- Iron hill café
UPDATE public.transport_expenses SET amount = 400.00  WHERE id = 'fe1486f4-841e-4c60-b461-d0184b735fd1'; -- This is it café

-- Fix 6-8: 6/29 entries entered as ₹0 placeholders — fill in actual amounts.
UPDATE public.transport_expenses SET amount = 1300.00 WHERE id = 'e2cec5b9-ea51-4e8e-8683-2f11b71c421b'; -- Chaitanya's Modern Kitchen
UPDATE public.transport_expenses SET amount = 600.00  WHERE id = 'd74129cb-6e82-4309-a716-a0ee6733c211'; -- Soul of South Financial District
UPDATE public.transport_expenses SET amount = 700.00  WHERE id = 'cf1dfc48-48cc-477b-8b9d-776313ff48b4'; -- Tawalogy

-- Insert 1: Missing Morya Labels 6/14 ₹300.
INSERT INTO public.transport_expenses (expense_date, description, amount)
SELECT '2026-06-14', 'Morya Labels Transport', 300.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE expense_date = '2026-06-14' AND description = 'Morya Labels Transport'
);

-- Insert 2: Missing Labels 6/14 ₹350.
INSERT INTO public.transport_expenses (expense_date, description, amount)
SELECT '2026-06-14', 'Labels Transport', 350.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE expense_date = '2026-06-14' AND description = 'Labels Transport'
);

-- Insert 3: Missing Morya Labels 6/26 ₹300.
INSERT INTO public.transport_expenses (expense_date, description, amount)
SELECT '2026-06-26', 'Morya Labels Transport', 300.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE expense_date = '2026-06-26' AND description = 'Morya Labels Transport'
);

-- Insert 4: Missing Labels 6/26 ₹350.
INSERT INTO public.transport_expenses (expense_date, description, amount)
SELECT '2026-06-26', 'Labels Transport', 350.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE expense_date = '2026-06-26' AND description = 'Labels Transport'
);

-- Insert 5: Missing Biryanis and More, Warangal 6/29 transport ₹7,000.
INSERT INTO public.transport_expenses (expense_date, description, amount)
SELECT '2026-06-29', 'Biryanis and More-Warangal Transport', 7000.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE expense_date = '2026-06-29' AND description = 'Biryanis and More-Warangal Transport'
);

-- Insert 6: Missing Chaitanya's Modern Kitchen 6/29 labour ₹200.
INSERT INTO public.transport_expenses (expense_date, description, amount)
SELECT '2026-06-29', 'Chaitanya''s Modern Kitchen Labour', 200.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE expense_date = '2026-06-29' AND description = 'Chaitanya''s Modern Kitchen Labour'
);
