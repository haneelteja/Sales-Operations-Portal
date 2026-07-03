-- Fix Chaitanya's Modern Kitchen 9/23/2025 P 500 ml client entry:
-- portal has qty=60 / ₹10,500 but Elma shows qty=33 / ₹5,775.

UPDATE public.sales_transactions st
SET quantity = 33, amount = 5775.00
FROM public.customers c
WHERE st.customer_id = c.id
  AND c.client_name ILIKE '%chaitanya%'
  AND st.transaction_type = 'sale'
  AND st.transaction_date = '2025-09-23'
  AND st.sku = 'P 500 ml'
  AND st.quantity = 60;
