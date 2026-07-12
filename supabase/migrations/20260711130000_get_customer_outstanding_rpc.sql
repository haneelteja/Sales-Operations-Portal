-- RPC: get_customer_outstanding
-- Used by send-report-emails edge function (outstanding, payment-followup, and credit-risk sections)
-- and by payment-reminder-scheduler and ManualPaymentReminder UI.
--
-- Returns per-customer outstanding balance with invoice count and oldest unpaid sale date.
-- Only includes customers who have at least one sales transaction.
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
    COALESCE(SUM(CASE WHEN st.transaction_type = 'sale'    THEN st.amount ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN st.transaction_type = 'payment' THEN st.amount ELSE 0 END), 0)
                                                                                  AS outstanding,
    COUNT(CASE WHEN st.transaction_type = 'sale' THEN 1 END)                     AS invoice_count,
    MIN(CASE WHEN st.transaction_type = 'sale' THEN st.transaction_date END)      AS oldest_sale_date
  FROM customers c
  INNER JOIN sales_transactions st ON st.customer_id = c.id
  GROUP BY c.id
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_outstanding() TO anon, authenticated;
