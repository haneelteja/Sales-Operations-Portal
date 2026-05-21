-- Transaction detail for Alley 91, Tawalogy, Tilaks Kitchen.
-- Shows every sales_transactions row so we can spot duplicates / wrong amounts.

SELECT
  c.client_name,
  c.branch,
  st.transaction_date,
  st.transaction_type,
  st.amount,
  st.sku,
  st.quantity,
  st.description,
  st.id AS transaction_id
FROM public.customers c
JOIN public.sales_transactions st ON st.customer_id = c.id
WHERE c.client_name ILIKE ANY(ARRAY['%tawalogy%', '%tilak%', '%alley 91%'])
ORDER BY c.client_name, c.branch, st.transaction_date, st.transaction_type;
