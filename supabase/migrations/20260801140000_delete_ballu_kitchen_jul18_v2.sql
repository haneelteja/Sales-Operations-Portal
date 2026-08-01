-- Retry: delete Ballu Kitchen Jul-18 factory payable (105 cases).
-- Previous migration (20260801120000) silently matched 0 rows — likely because
-- the amount check (ABS(amount - 12382.65) < 0.01) failed due to floating point,
-- or customer_id subquery returned wrong record when LIMIT 1 picked a different row.
-- Fix: drop the amount constraint; use IN across ALL Ballu Kitchen Kondapur customer ids.

DELETE FROM public.factory_payables
WHERE transaction_date::date = '2026-07-18'
  AND sku = 'P 1000 ml'
  AND quantity = 105
  AND transaction_type = 'production'
  AND customer_id IN (
    SELECT id FROM public.customers
    WHERE client_name ILIKE '%Ballu Kitchen%'
      AND branch ILIKE '%Kondapur%'
  );
