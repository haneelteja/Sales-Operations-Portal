-- Fix Jismat/Gismat-Dilshuknagar 11/5/2025 P 500 ml client entry:
-- portal has qty=55 / ₹9,450 but Elma shows 80 delivery + (-25 return) + (+25 adj ₹0) = net 80 cases.
-- The +25 transfer at ₹0 was never recorded; qty should be 80. Amount ₹9,450 is correct.

UPDATE public.sales_transactions st
SET quantity = 80
FROM public.customers c
WHERE st.customer_id = c.id
  AND c.client_name ILIKE '%ismat%'
  AND c.branch ILIKE '%dilshuk%'
  AND st.transaction_type = 'sale'
  AND st.transaction_date = '2025-11-05'
  AND st.sku = 'P 500 ml'
  AND st.quantity = 55;
