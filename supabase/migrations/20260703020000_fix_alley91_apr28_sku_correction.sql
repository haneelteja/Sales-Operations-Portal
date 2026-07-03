-- Fix 4/28/2026 Alley 91: 25 cases were entered as "P 250 ml" but factory
-- records them as "P 500 ml". SKU correction only — amount unchanged.

UPDATE public.sales_transactions st
SET sku = 'P 500 ml'
FROM public.customers c
WHERE st.customer_id = c.id
  AND c.client_name ILIKE '%Alley%91%'
  AND st.transaction_date = '2026-04-28'
  AND st.sku = 'P 250 ml'
  AND st.quantity = 25;
