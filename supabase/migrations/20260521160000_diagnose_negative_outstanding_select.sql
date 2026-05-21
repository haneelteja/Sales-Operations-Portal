-- Diagnostic: outstanding balances + transaction detail for
-- Tawalogy, Tilaks Kitchen, Alley 91 — returns rows (no RAISE NOTICE).

-- Part 1: Summary per customer
SELECT
  c.client_name,
  c.branch,
  c.id                                                                      AS customer_id,
  COALESCE(SUM(CASE WHEN st.transaction_type = 'sale'    THEN st.amount ELSE 0 END), 0) AS total_sales,
  COALESCE(SUM(CASE WHEN st.transaction_type = 'payment' THEN st.amount ELSE 0 END), 0) AS total_payments,
  COALESCE(SUM(CASE WHEN st.transaction_type = 'sale'    THEN st.amount ELSE 0 END), 0)
  - COALESCE(SUM(CASE WHEN st.transaction_type = 'payment' THEN st.amount ELSE 0 END), 0) AS outstanding
FROM public.customers c
LEFT JOIN public.sales_transactions st ON st.customer_id = c.id
WHERE c.client_name ILIKE ANY(ARRAY['%tawalogy%', '%tilak%', '%alley 91%'])
GROUP BY c.id, c.client_name, c.branch
ORDER BY c.client_name, c.branch;
