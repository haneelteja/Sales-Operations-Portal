-- Delete the 5 negative factory payment entries added by migration 20260926110000.
-- Root cause: the portal stores payments as POSITIVE amounts (live UI entry convention).
-- Migration 20260926110000 stored them as negative, creating duplicate sign-flipped entries
-- that cancel the positive live-data entries and inflate factory outstanding.
-- Equivalent pattern to 20260701240000 which fixed the same issue for Feb 2026.

DELETE FROM public.factory_payables
WHERE transaction_type = 'payment'
  AND amount < 0
  AND transaction_date IN ('2026-09-02', '2026-09-07', '2026-09-11', '2026-09-23', '2026-09-26')
  AND description = 'Bank Transfer';
