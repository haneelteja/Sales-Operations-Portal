-- Fix May 2025 transport_expenses discrepancies vs Elma ledger (2026-06-30).

-- Fix 1: Tilaks kitchen 5/7 — wrong amount ₹1,175 → ₹1,125.
UPDATE public.transport_expenses
SET amount = 1125.00
WHERE id = '605df8a6-b77b-4582-af65-8870a07acd4e';

-- Fix 2: 5/13 duplicate Jismat-Dilshuknagar was entered instead of Gismat-Ameerpet.
-- Correct it to the missing Gismat-Ameerpet ₹1,400 entry.
UPDATE public.transport_expenses
SET description  = 'Gismat-Ameerpet Transport',
    expense_group = 'General',
    amount        = 1400.00
WHERE id = '9698db52-58bf-4c37-90ee-38bdf1d8c063';

-- Fix 3: 5/24 second Khammam entry is actually the Warangal delivery (same ₹8,500, wrong label).
UPDATE public.transport_expenses
SET description  = 'Biryanis and More-Warangal Transport',
    expense_group = 'General'
WHERE id = 'a343c357-4f8a-4bcf-9e5e-25c2ca5361c9';
