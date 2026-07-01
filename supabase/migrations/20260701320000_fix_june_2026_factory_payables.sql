-- Fix June 2026 factory_payables discrepancies vs Elma ledger (2026-07-01).

-- Fix 1: Thatha Kottu Tiffins 6/3 factory entry — qty was 55 (₹6,858.50), corrected to 54 (₹6,733.80).
-- Matches the client-side qty fix in migration 20260701310000.
UPDATE public.factory_payables SET quantity = 54, amount = 6733.80 WHERE id = 'be395fe1-469b-46c0-9a90-cdbb9f24e980';
