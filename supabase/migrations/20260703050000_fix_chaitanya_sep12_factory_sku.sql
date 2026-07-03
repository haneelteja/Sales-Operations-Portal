-- Fix Chaitanya's Modern Kitchen 9/12/2025 factory entry: recorded as
-- "P 1000 ml" but Elma factory shows "P 500 ml". SKU correction only.

UPDATE public.factory_payables fp
SET sku = 'P 500 ml'
FROM public.customers c
WHERE fp.customer_id = c.id
  AND c.client_name ILIKE '%chaitanya%'
  AND fp.transaction_type = 'production'
  AND fp.transaction_date = '2025-09-12'
  AND fp.sku = 'P 1000 ml'
  AND fp.quantity = 50;
