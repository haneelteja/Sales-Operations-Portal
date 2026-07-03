-- Fix 12/23/2025 Alley 91: 30 cases were entered as "P 250 ml" but factory
-- records them as "250 EC". SKU correction only — amount unchanged.

UPDATE public.sales_transactions st
SET sku = '250 EC'
FROM public.customers c
WHERE st.customer_id = c.id
  AND c.client_name ILIKE '%Alley%91%'
  AND st.transaction_date = '2025-12-23'
  AND st.sku = 'P 250 ml'
  AND st.quantity = 30;
