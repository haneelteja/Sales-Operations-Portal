-- Check the actual sale records for Deccan kitchen and jagan Pan House
SELECT
  c.client_name,
  c.branch,
  st.sku,
  st.transaction_date::date AS sale_date,
  st.quantity,
  st.amount,
  st.description
FROM public.sales_transactions st
JOIN public.customers c ON c.id = st.customer_id
WHERE st.transaction_type = 'sale'
  AND (
    (c.client_name = 'Deccan kitchen'  AND st.sku = '250 EC')
 OR (c.client_name = 'jagan Pan House' AND st.sku = 'P 1000 ml')
  )
ORDER BY c.client_name, st.transaction_date DESC;
