-- Fix September 2025 transport_expenses discrepancies vs Elma ledger (2026-07-01).

-- Fix 1: Maryadha Ramanna LB Nagar 9/18 ABS Stock Transport — ₹875→₹1,500.
UPDATE public.transport_expenses
SET amount = 1500.00
WHERE id = 'a08bcb91-fea6-48e5-a7b2-06144061e7a2';

-- Fix 2: Benguluru Bhavan 9/27 Transport — ₹700→₹1,000.
UPDATE public.transport_expenses
SET amount = 1000.00
WHERE id = 'b4f07911-6bf3-4473-8610-41369672e764';
