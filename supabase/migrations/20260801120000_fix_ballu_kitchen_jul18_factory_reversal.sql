-- Ballu Kitchen Jul 18 factory payable correction.
-- Elma shows: Jul 18 (+105 cases) was reversed Jul 31 (-105) then re-entered as 70 cases.
-- The sales side netted correctly to 70 cases, but the Jul 18 factory payable was never reversed.
-- Result: factory cost included 175-case worth of payables for a 70-case delivery.
-- Fix: delete the unreversed Jul 18 entry (105 cases × ₹117.93 = ₹12,382.65).

DELETE FROM public.factory_payables
WHERE transaction_date::date = '2026-07-18'
  AND sku = 'P 1000 ml'
  AND quantity = 105
  AND ABS(amount - 12382.65) < 0.01
  AND transaction_type = 'production'
  AND customer_id = (
    SELECT id FROM public.customers
    WHERE client_name ILIKE '%Ballu Kitchen%'
      AND branch ILIKE '%Kondapur%'
    ORDER BY id
    LIMIT 1
  );
