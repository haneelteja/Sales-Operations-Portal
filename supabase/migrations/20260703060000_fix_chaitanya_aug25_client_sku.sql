-- Fix Chaitanya's Modern Kitchen 8/25/2025 client entry: recorded as
-- "AL 500 ml" but Elma client shows "EL 500 ml". SKU correction only.

UPDATE public.sales_transactions st
SET sku = 'EL 500 ml'
FROM public.customers c
WHERE st.customer_id = c.id
  AND c.client_name ILIKE '%chaitanya%'
  AND st.transaction_type = 'sale'
  AND st.transaction_date = '2025-08-25'
  AND st.sku = 'AL 500 ml'
  AND st.quantity = 20;
