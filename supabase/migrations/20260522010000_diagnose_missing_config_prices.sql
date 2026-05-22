-- Latest sale amount/quantity for each missing configuration combo
-- to infer the price_per_case to use when inserting the missing rows.
SELECT DISTINCT ON (c.client_name, c.branch, st.sku)
  c.client_name,
  c.branch,
  st.sku,
  st.transaction_date::date       AS latest_sale_date,
  st.quantity,
  st.amount,
  ROUND((st.amount / NULLIF(st.quantity, 0))::numeric, 2) AS implied_price_per_case
FROM public.sales_transactions st
JOIN public.customers c ON c.id = st.customer_id
WHERE st.transaction_type = 'sale'
  AND st.sku IS NOT NULL
  AND st.quantity > 0
  AND (
    (c.client_name = 'Alley 91'       AND c.branch = 'Nanakramguda'        AND st.sku IN ('P 250 ml', 'P 500 ml'))
 OR (c.client_name = 'Deccan kitchen' AND c.branch = 'Film nagar'          AND st.sku = '250 EC')
 OR (c.client_name = 'jagan Pan House' AND c.branch = 'Bhoodan Pochampally' AND st.sku = 'P 1000 ml')
  )
ORDER BY c.client_name, c.branch, st.sku, st.transaction_date DESC;
