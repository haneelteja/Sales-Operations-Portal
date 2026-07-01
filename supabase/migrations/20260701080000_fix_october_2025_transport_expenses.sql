-- Fix October 2025 transport_expenses discrepancies vs Elma ledger (2026-07-01).

-- Fix 1: Gismat-Tenali Transport — date 2025-10-21→2025-10-23.
UPDATE public.transport_expenses
SET expense_date = '2025-10-23'
WHERE id = '202a7f59-b6b8-408e-9517-adbaa183b6e5';
