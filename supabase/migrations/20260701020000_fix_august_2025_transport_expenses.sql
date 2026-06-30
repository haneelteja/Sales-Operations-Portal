-- Fix August 2025 transport_expenses discrepancies vs Elma ledger (2026-07-01).

-- Fix 1: Benguluru Bhavan 8/4 — ₹600→₹1,000 (wrong amount).
UPDATE public.transport_expenses
SET amount = 1000.00
WHERE id = 'f154c89d-d746-4325-bf7a-5ae7bdb6b5fb';

-- Fix 2: Labels 8/19 — ₹250→₹600 (wrong amount).
UPDATE public.transport_expenses
SET amount = 600.00
WHERE id = '30411559-282c-44c0-9826-79faaf8d82fa';
