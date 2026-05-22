-- Show all customers rows for Alley 91 + all SKUs used in their sales transactions
SELECT source, client_name, branch, sku, pricing_date::text, price_per_case::text, is_active::text
FROM (
  SELECT 'customers_table' AS source, client_name, branch, sku, pricing_date, price_per_case, is_active
  FROM public.customers
  WHERE client_name ILIKE '%alley%'

  UNION ALL

  SELECT DISTINCT 'sales_transactions', c.client_name, c.branch, st.sku, NULL::date, NULL::numeric, NULL::boolean
  FROM public.sales_transactions st
  JOIN public.customers c ON c.id = st.customer_id
  WHERE c.client_name ILIKE '%alley%'
    AND st.transaction_type = 'sale'
) combined
ORDER BY source, branch, sku;
