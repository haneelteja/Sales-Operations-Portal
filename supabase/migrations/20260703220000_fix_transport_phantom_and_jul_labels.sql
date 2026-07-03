-- Fix two transport discrepancies vs Elma:
--
-- 1. Delete phantom Nov 2026 entry: Chaitanya's Modern Kitchen-Khajaguda ₹1,100
--    Root cause: entered on 2026-06-18 as historical backfill but typed year 2026
--    instead of 2025. The correct 2025-11-20 entry already exists in the portal.
--
-- 2. Add 2 missing Jul 3 2026 labels transport entries not yet entered in portal:
--    - Morya Labels Transport ₹300
--    - Labels Transport ₹350
--    These bring Jul 2026 total from ₹2,000 → ₹2,650 (matching Elma).

-- 1. Remove duplicate/phantom future-dated entry
DELETE FROM public.transport_expenses
WHERE id = '1e8b4581-a919-4c3f-aa43-c10452ee10d8';

-- 2a. Morya Labels Transport
INSERT INTO public.transport_expenses (expense_date, amount, description, expense_group)
VALUES ('2026-07-03', 300.00, 'Morya Labels Transport', 'labels');

-- 2b. Labels Transport
INSERT INTO public.transport_expenses (expense_date, amount, description, expense_group)
VALUES ('2026-07-03', 350.00, 'Labels Transport', 'labels');
