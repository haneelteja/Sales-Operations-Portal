-- Fix January 2026 factory_payables discrepancies vs Elma ledger (2026-07-01).

-- Fix 1: Soul of South return 1/23 — qty -50→-51, amount -5460→-5569.
UPDATE public.factory_payables SET quantity = -51, amount = -5569.00
WHERE id = '8f2b80e0-f2b2-455c-8fad-8efa45566d55';
