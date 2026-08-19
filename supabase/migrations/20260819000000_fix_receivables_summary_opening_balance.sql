-- Fix get_receivables_summary to include opening_balance in the outstanding calculation.
-- Previously: outstanding = SUM(sales) - SUM(payments)
-- Now:        outstanding = opening_balance + SUM(sales) - SUM(payments)
-- opening_balance is stored on customers; MAX() is used because all SKU rows for
-- a (client_name, branch) pair share the same value.

CREATE OR REPLACE FUNCTION get_receivables_summary()
RETURNS TABLE (
  customer_id           uuid,
  client_name           text,
  branch                text,
  outstanding           numeric,
  payment_count         bigint,
  last_payment_date     date,
  first_payment_date    date,
  payments_this_month   numeric
)
SECURITY DEFINER
LANGUAGE sql
STABLE
AS $$
  SELECT
    -- Pick the customer_id with the most transactions as the representative.
    (
      SELECT st2.customer_id
      FROM sales_transactions st2
      INNER JOIN customers c2 ON c2.id = st2.customer_id
      WHERE c2.client_name = agg.client_name
        AND COALESCE(c2.branch, '') = agg.branch
      GROUP BY st2.customer_id
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) AS customer_id,
    agg.client_name,
    agg.branch,
    agg.outstanding,
    agg.payment_count,
    agg.last_payment_date,
    agg.first_payment_date,
    agg.payments_this_month
  FROM (
    SELECT
      c.client_name,
      COALESCE(c.branch, '')                                                       AS branch,
      COALESCE(MAX(c.opening_balance), 0)
        + COALESCE(SUM(CASE WHEN st.transaction_type = 'sale'    THEN st.amount ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN st.transaction_type = 'payment' THEN st.amount ELSE 0 END), 0)
                                                                                   AS outstanding,
      COUNT(CASE WHEN st.transaction_type = 'payment' THEN 1 END)                 AS payment_count,
      MAX(CASE WHEN st.transaction_type = 'payment' THEN st.transaction_date END) AS last_payment_date,
      MIN(CASE WHEN st.transaction_type = 'payment' THEN st.transaction_date END) AS first_payment_date,
      COALESCE(SUM(CASE
        WHEN st.transaction_type = 'payment'
          AND st.transaction_date >= date_trunc('month', CURRENT_DATE)::date
        THEN st.amount
        ELSE 0
      END), 0)                                                                     AS payments_this_month
    FROM customers c
    INNER JOIN sales_transactions st ON st.customer_id = c.id
    GROUP BY c.client_name, COALESCE(c.branch, '')
  ) agg
$$;

GRANT EXECUTE ON FUNCTION get_receivables_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_receivables_summary() TO anon;
