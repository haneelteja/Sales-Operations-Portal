-- Remove two erroneous negative factory entries for Maryadha Ramanna - Kondapur
-- dated 11/11/2025 that have no corresponding record in the Elma factory ledger.
-- P 1000 ml (-60 / ₹-6,086) and P 500 ml (-20 / ₹-2,184).

DELETE FROM public.factory_payables fp
USING public.customers c
WHERE fp.customer_id = c.id
  AND c.client_name ILIKE '%maryadha%'
  AND c.branch ILIKE '%kondapur%'
  AND fp.transaction_type = 'production'
  AND fp.transaction_date = '2025-11-11'
  AND fp.quantity < 0;
