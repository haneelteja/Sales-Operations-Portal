-- Server-side aggregation for receivables tracking.
-- Bypasses PostgREST's 1000-row default cap that caused random transactions to be
-- silently dropped when sales_transactions exceeded 1000 rows.
CREATE OR REPLACE FUNCTION get_receivables_summary()
RETURNS TABLE (
  customer_id  uuid,
  client_name  text,
  branch       text,
  outstanding  numeric,
  payment_count bigint,
  last_payment_date  date,
  first_payment_date date,
  payments_this_month numeric
)
SECURITY DEFINER
LANGUAGE sql
STABLE
AS $$
  SELECT
    c.id                                                                   AS customer_id,
    c.client_name,
    COALESCE(c.branch, '')                                                 AS branch,
    COALESCE(SUM(CASE WHEN st.transaction_type = 'sale'    THEN st.amount ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN st.transaction_type = 'payment' THEN st.amount ELSE 0 END), 0)
                                                                           AS outstanding,
    COUNT(CASE WHEN st.transaction_type = 'payment' THEN 1 END)           AS payment_count,
    MAX(CASE WHEN st.transaction_type = 'payment' THEN st.transaction_date END)
                                                                           AS last_payment_date,
    MIN(CASE WHEN st.transaction_type = 'payment' THEN st.transaction_date END)
                                                                           AS first_payment_date,
    COALESCE(SUM(CASE
      WHEN st.transaction_type = 'payment'
        AND st.transaction_date >= date_trunc('month', CURRENT_DATE)::date
      THEN st.amount
      ELSE 0
    END), 0)                                                               AS payments_this_month
  FROM customers c
  INNER JOIN sales_transactions st ON st.customer_id = c.id
  GROUP BY c.id, c.client_name, c.branch
$$;

GRANT EXECUTE ON FUNCTION get_receivables_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_receivables_summary() TO anon;
