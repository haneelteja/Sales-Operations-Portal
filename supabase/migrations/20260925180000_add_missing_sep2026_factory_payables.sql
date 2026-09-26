-- Factory payables for the Sep 25 deliveries added in migration 20260925170000.

-- This is it café: 104 cases / Rs 12,969
INSERT INTO public.factory_payables
  (customer_id, transaction_type, quantity, amount, transaction_date, sku)
SELECT
  (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1),
  'production', 104, 12969, '2026-09-25', 'P 500 ml'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE customer_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'This is it café' LIMIT 1)
    AND transaction_date = '2026-09-25'
    AND quantity = 104
);

-- Embassy Twilight: 63 cases / Rs 7,856
INSERT INTO public.factory_payables
  (customer_id, transaction_type, quantity, amount, transaction_date, sku)
SELECT
  (SELECT id FROM public.customers WHERE client_name ILIKE 'Embassy Twilight' LIMIT 1),
  'production', 63, 7856, '2026-09-25', 'P 500 ml'
WHERE NOT EXISTS (
  SELECT 1 FROM public.factory_payables
  WHERE customer_id = (SELECT id FROM public.customers WHERE client_name ILIKE 'Embassy Twilight' LIMIT 1)
    AND transaction_date = '2026-09-25'
    AND quantity = 63
);
