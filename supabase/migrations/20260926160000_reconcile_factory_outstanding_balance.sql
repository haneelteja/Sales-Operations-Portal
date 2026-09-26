-- Factory outstanding balance reconciliation Sep 2026.
--
-- Root cause: portal has ~₹2.71L less production than Elma across historical entries
-- (one-time/seasonal clients like Chandhu Poda, TOS Club, Tonique, Mid land, Hotel Vinflora
-- etc. whose factory entries were backfilled at slightly different amounts, plus some
-- recent clients not yet in portal — total 307k potential, ~271k unexplained delta).
--
-- Elma outstanding = ₹5,37,779.59 (production 70,79,128.15 – payments 65,41,348.55).
-- Portal before this migration = ~₹2,67,000 (after Sep 2026 payment sign fix).
--
-- This self-computing insert adds exactly the delta needed so portal matches Elma.
-- Safe to reapply: NOT EXISTS guard on description prevents double-insertion.

INSERT INTO public.factory_payables
  (transaction_date, transaction_type, amount, description)
SELECT
  '2026-09-26',
  'production',
  537779.59 - (
    COALESCE((SELECT SUM(amount) FROM public.factory_payables WHERE transaction_type = 'production'), 0)
    - COALESCE((SELECT SUM(amount) FROM public.factory_payables WHERE transaction_type = 'payment'), 0)
  ),
  'Balance reconciliation Sep-2026 — align factory outstanding with Elma 537779.59'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE transaction_type = 'production'
    AND description = 'Balance reconciliation Sep-2026 — align factory outstanding with Elma 537779.59'
);
