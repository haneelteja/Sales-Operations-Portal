-- Fix get_customer_outstanding to group by client_name + branch instead of customer_id.
--
-- Root cause: some clients have multiple customer_id records in the customers table,
-- with sales recorded against one ID and payments against another. Grouping by customer_id
-- caused the two to appear as separate rows — the sales-only ID showed full outstanding,
-- the payments-only ID was excluded entirely by the INNER JOIN (no matching sales rows).
--
-- Grouping by name+branch (same as get_receivables_summary) aggregates all transactions
-- across every customer_id for the same client+branch, producing the correct net balance.
-- A representative customer_id is returned (the ID with the most transactions) for name
-- resolution in the email edge function.
CREATE OR REPLACE FUNCTION public.get_customer_outstanding()
RETURNS TABLE(
  customer_id      UUID,
  outstanding      NUMERIC,
  invoice_count    BIGINT,
  oldest_sale_date DATE
)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Pick the customer_id with the most transactions for this name+branch pair
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
    GROUP BY c.client_name, COALESCE(c.branch, '')
  ) agg
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_outstanding() TO anon, authenticated;
