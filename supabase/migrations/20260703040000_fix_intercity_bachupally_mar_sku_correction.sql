-- Fix Intercity-Bachupally 3/1–3/12/2026: 12 entries entered as "250 EC"
-- but should be "EL 500 ml". SKU correction only — amounts unchanged.

UPDATE public.sales_transactions st
SET sku = 'EL 500 ml'
FROM public.customers c
WHERE st.customer_id = c.id
  AND c.client_name ILIKE '%intercity%'
  AND c.branch ILIKE '%bachupally%'
  AND st.transaction_type = 'sale'
  AND st.sku = '250 EC'
  AND st.transaction_date BETWEEN '2026-03-01' AND '2026-03-12';
