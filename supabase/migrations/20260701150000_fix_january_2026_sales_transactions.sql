-- Fix January 2026 sales_transactions discrepancies vs Elma ledger (2026-07-01).

-- Delete 1: Fusion Aroma Nallagandla 1/7 payment ₹12,180 — not in Elma ledger.
DELETE FROM public.sales_transactions
WHERE id = 'a39130f2-7e8b-49a7-9432-44376f49a93f';

-- Fix 1: Mid land Andhra Pradesh 1/31 — add description 'adjustment'.
UPDATE public.sales_transactions
SET description = 'adjustment'
WHERE id = '218369c4-5982-4229-9497-11a38045d20c';
