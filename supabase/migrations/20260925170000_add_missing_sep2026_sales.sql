-- This is it café: 104 missing cases (Rs 20,800) — Sep 25 delivery
-- Elma total: 190 cases / Rs 38,000. Portal had 86 / Rs 17,200.
INSERT INTO public.sales_transactions
  (customer_id, transaction_type, quantity, amount, transaction_date, sku)
SELECT
  (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1),
  'sale', 104, 20800, '2026-09-25', 'P 500 ml'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1)
    AND transaction_date = '2026-09-25'
    AND quantity = 104
    AND transaction_type = 'sale'
);

-- Twilight Embassy: 63 missing cases (Rs 11,340) — Sep 25 delivery
-- Elma total: 116 cases / Rs 20,880. Portal had 53 / Rs 9,540.
-- Customer is stored as 'Embassy Twilight' in the customers table.
INSERT INTO public.sales_transactions
  (customer_id, transaction_type, quantity, amount, transaction_date, sku)
SELECT
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Embassy Twilight' LIMIT 1),
  'sale', 63, 11340, '2026-09-25', 'P 500 ml'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions
  WHERE customer_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Embassy Twilight' LIMIT 1)
    AND transaction_date = '2026-09-25'
    AND quantity = 63
    AND transaction_type = 'sale'
);
