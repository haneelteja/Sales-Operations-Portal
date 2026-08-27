-- Fix get_customer_outstanding to include opening_balance in the outstanding calculation.
-- Previously the function only summed sales_transactions, ignoring opening_balance.
-- This caused discrepancies vs get_receivables_summary (used by the UI) which includes it.
CREATE OR REPLACE FUNCTION public.get_customer_outstanding()
RETURNS TABLE(
  customer_id   UUID,
  outstanding   NUMERIC,
  invoice_count BIGINT,
  oldest_sale_date DATE
)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id                                                                          AS customer_id,
    COALESCE(c.opening_balance, 0)
    + COALESCE(SUM(CASE WHEN st.transaction_type = 'sale'    THEN st.amount ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN st.transaction_type = 'payment' THEN st.amount ELSE 0 END), 0)
                                                                                  AS outstanding,
    COUNT(CASE WHEN st.transaction_type = 'sale' THEN 1 END)                     AS invoice_count,
    MIN(CASE WHEN st.transaction_type = 'sale' THEN st.transaction_date END)      AS oldest_sale_date
  FROM customers c
  INNER JOIN sales_transactions st ON st.customer_id = c.id
  GROUP BY c.id
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_outstanding() TO anon, authenticated;
