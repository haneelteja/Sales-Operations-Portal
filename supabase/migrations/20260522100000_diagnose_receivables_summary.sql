-- Current receivables summary: total sales, payments, and outstanding per client+branch
SELECT
  c.client_name,
  c.branch,
  ROUND(SUM(CASE WHEN st.transaction_type = 'sale'    THEN st.amount ELSE 0 END)::numeric, 2) AS total_sales,
  ROUND(SUM(CASE WHEN st.transaction_type = 'payment' THEN st.amount ELSE 0 END)::numeric, 2) AS total_payments,
  ROUND(SUM(CASE WHEN st.transaction_type = 'sale'    THEN st.amount
                 WHEN st.transaction_type = 'payment' THEN -st.amount
                 ELSE 0 END)::numeric, 2)                                                      AS outstanding
FROM public.sales_transactions st
JOIN public.customers c ON c.id = st.customer_id
GROUP BY c.client_name, c.branch
ORDER BY outstanding DESC;
