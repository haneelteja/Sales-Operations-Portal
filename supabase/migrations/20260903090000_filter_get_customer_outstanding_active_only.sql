-- Make get_customer_outstanding consistent with get_receivables_summary by
-- restricting to active clients only (is_active = true).
-- Previously had no is_active filter, so inactive clients with outstanding
-- balances appeared in the payment follow-up email but not the tracker.

CREATE OR REPLACE FUNCTION public.get_customer_outstanding()
RETURNS TABLE (
  customer_id uuid,
  outstanding  numeric,
  invoice_count bigint,
  oldest_sale_date date
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    (
      SELECT st2.customer_id
      FROM sales_transactions st2
      INNER JOIN customers c2 ON c2.id = st2.customer_id
      WHERE c2.client_name = agg.client_name
        AND COALESCE(c2.branch, '') = agg.branch
      GROUP BY st2.customer_id
      ORDER BY COUNT(*) DESC
      LIMIT 1
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
    INNER JOIN sales_transactions st ON st.customer_id = c.id
    WHERE c.is_active = true
    GROUP BY c.client_name, COALESCE(c.branch, '')
  ) agg
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_outstanding() TO anon, authenticated;
