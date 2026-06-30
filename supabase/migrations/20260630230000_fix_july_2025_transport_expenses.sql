-- Fix July 2025 transport_expenses discrepancies vs Elma ledger (2026-06-30).

-- Fix 1: Benguluru Bhavan 7/9 — typo ₹7,500→₹750 (extra zero).
UPDATE public.transport_expenses
SET amount = 750.00
WHERE id = '369b5989-ded0-49dc-9f0c-561d33234a11';

-- Fix 2: Benguluru Bhavan — date 7/15→7/16.
UPDATE public.transport_expenses
SET expense_date = '2025-07-16'
WHERE id = 'e771029d-fd74-4319-bb19-4102c71d0315';

-- Fix 3: Gismat-Kondapur — date 7/15→7/16.
UPDATE public.transport_expenses
SET expense_date = '2025-07-16'
WHERE id = '365e05df-58ff-4b6c-9822-ed9ddeaf2c7f';

-- Fix 4: Blossamin Spa 7/23 — typo ₹2,000→₹200 (extra zero).
UPDATE public.transport_expenses
SET amount = 200.00
WHERE id = '9a379fb5-aba6-4b7f-8116-0be78c5cff7d';

-- Fix 5: Delete duplicate Gismat-Pragathi nagar 7/29 (two ₹800 entries, Elma has one).
-- Keep b0c18949 (Client Sale Transport), delete 590050da (General duplicate).
DELETE FROM public.transport_expenses
WHERE id = '590050da-5e0d-4278-8b3c-379080d23f05';

-- Insert 1: Missing Labels Transport 7/1 ₹460.
INSERT INTO public.transport_expenses (expense_date, description, amount, expense_group)
SELECT '2025-07-01', 'Labels Transport', 460.00, 'labels'
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE expense_date = '2025-07-01' AND description = 'Labels Transport' AND amount = 460.00
);

-- Insert 2: Missing Dakshin Aroma Transport 7/29 ₹150.
INSERT INTO public.transport_expenses (expense_date, description, amount, expense_group)
SELECT '2025-07-29', 'Dakshin Aroma Transport', 150.00, 'General'
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_expenses
  WHERE expense_date = '2025-07-29' AND description = 'Dakshin Aroma Transport' AND amount = 150.00
);
