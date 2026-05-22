-- Correct diagnostic: find (client_name, branch, sku) combos used in sales_transactions
-- that have NO matching customers configuration row.
-- Uses client_name+branch from the joined customer, but checks SKU from the transaction.

SELECT
  c.client_name,
  c.branch,
  st.sku,
  COUNT(*) AS sale_count
FROM public.sales_transactions st
JOIN public.customers c ON c.id = st.customer_id
WHERE st.transaction_type = 'sale'
  AND st.sku IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.customers cfg
    WHERE cfg.client_name = c.client_name
      AND cfg.branch       = c.branch
      AND cfg.sku          = st.sku
      AND cfg.is_active    = true
  )
GROUP BY c.client_name, c.branch, st.sku
ORDER BY c.client_name, c.branch, st.sku;
