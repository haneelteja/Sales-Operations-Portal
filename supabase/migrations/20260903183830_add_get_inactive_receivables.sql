-- Returns client+branch pairs where ALL customer_ids have is_active = false.
-- These are clients explicitly deactivated in configuration, not derived from
-- delivery dates. Used by the Inactive mode in the Receivables Tracker.

CREATE OR REPLACE FUNCTION public.get_inactive_receivables()
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
    (
      SELECT COALESCE(
        (
          SELECT st2.customer_id
          FROM sales_transactions st2
          INNER JOIN customers c2 ON c2.id = st2.customer_id
          WHERE c2.client_name = agg.client_name
            AND COALESCE(c2.branch, '') = agg.branch
          GROUP BY st2.customer_id
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ),
        (
          SELECT c3.id
          FROM customers c3
          WHERE c3.client_name = agg.client_name
            AND COALESCE(c3.branch, '') = agg.branch
          ORDER BY c3.created_at
          LIMIT 1
        )
      )
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
      COALESCE(c.branch, '')                                                           AS branch,
      COALESCE(MAX(c.opening_balance), 0)
        + COALESCE(SUM(CASE WHEN st.transaction_type = 'sale'    THEN st.amount ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN st.transaction_type = 'payment' THEN st.amount ELSE 0 END), 0)
                                                                                       AS outstanding,
      COUNT(CASE WHEN st.transaction_type = 'payment' THEN 1 END)                     AS payment_count,
      MAX(CASE WHEN st.transaction_type = 'payment' THEN st.transaction_date END)     AS last_payment_date,
      MIN(CASE WHEN st.transaction_type = 'payment' THEN st.transaction_date END)     AS first_payment_date,
      COALESCE(SUM(CASE
        WHEN st.transaction_type = 'payment'
          AND st.transaction_date >= date_trunc('month', CURRENT_DATE)::date
        THEN st.amount
        ELSE 0
      END), 0)                                                                         AS payments_this_month
    FROM customers c
    LEFT JOIN sales_transactions st ON st.customer_id = c.id
    WHERE NOT EXISTS (
      SELECT 1 FROM customers c_active
      WHERE c_active.client_name = c.client_name
        AND COALESCE(c_active.branch, '') = COALESCE(c.branch, '')
        AND c_active.is_active = true
    )
    GROUP BY c.client_name, COALESCE(c.branch, '')
  ) agg
$$;

GRANT EXECUTE ON FUNCTION public.get_inactive_receivables() TO anon, authenticated;
