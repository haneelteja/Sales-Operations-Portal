-- Fix Jismat/Gismat-Ameerpet 9/9/2025 client sale: recorded as P 1000 ml
-- but Elma client ledger shows P 500 ml. SKU correction only; qty and amount unchanged.

UPDATE public.sales_transactions st
SET sku = 'P 500 ml'
FROM public.customers c
WHERE st.customer_id = c.id
  AND c.client_name ILIKE '%ismat%'
  AND c.branch ILIKE '%ameerpet%'
  AND st.transaction_type = 'sale'
  AND st.transaction_date = '2025-09-09'
  AND st.sku = 'P 1000 ml'
  AND st.quantity = 100;
