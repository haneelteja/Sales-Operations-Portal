-- Change INNER JOIN → LEFT JOIN in get_customer_outstanding so clients with
-- only an opening balance (no sale transactions yet) are included, matching
-- the behaviour of get_receivables_summary used by the Receivables Tracker.

CREATE OR REPLACE FUNCTION public.get_customer_outstanding()
RETURNS TABLE (
  customer_id      uuid,
  outstanding      numeric,
  invoice_count    bigint,
  oldest_sale_date date
)
LANGUAGE sql
STABLE
SET search_path = public
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
        -- Fallback: no transactions — pick any customer_id for this pair
        (
          SELECT c3.id
          FROM customers c3
          WHERE c3.client_name = agg.client_name
            AND COALESCE(c3.branch, '') = agg.branch
            AND c3.is_active = true
          ORDER BY c3.created_at
          LIMIT 1
        )
      )
    )                                                                              AS customer_id,
    agg.outstanding,
    agg.invoice_count,
    agg.oldest_sale_date
  FROM (
    SELECT
      c.client_name,
      COALESCE(c.branch, '')                                                       AS branch,
      COALESCE(MAX(c.opening_balance), 0)
        + COALESCE(SUM(CASE WHEN st.transaction_type = 'sale'    THEN st.amount ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN st.transaction_type = 'payment' THEN st.amount ELSE 0 END), 0)
                                                                                   AS outstanding,
      COUNT(CASE WHEN st.transaction_type = 'sale' THEN 1 END)                    AS invoice_count,
      MIN(CASE WHEN st.transaction_type = 'sale' THEN st.transaction_date END)     AS oldest_sale_date
    FROM customers c
    LEFT JOIN sales_transactions st ON st.customer_id = c.id
    WHERE c.is_active = true
    GROUP BY c.client_name, COALESCE(c.branch, '')
  ) agg
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_outstanding() TO anon, authenticated;
