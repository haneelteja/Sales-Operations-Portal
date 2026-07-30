-- RPC to get daily sales totals by SKU for factory reconciliation.
CREATE OR REPLACE FUNCTION get_sales_by_sku(
  p_sku  text,
  p_from date DEFAULT NULL,
  p_to   date DEFAULT NULL
)
RETURNS TABLE (
  transaction_date date,
  sku              text,
  total_quantity   numeric,
  total_amount     numeric,
  client_count     bigint
)
SECURITY DEFINER
LANGUAGE sql
STABLE
AS $$
  SELECT
    st.transaction_date,
    st.sku,
    SUM(st.quantity)  AS total_quantity,
    SUM(st.amount)    AS total_amount,
    COUNT(DISTINCT st.customer_id) AS client_count
  FROM sales_transactions st
  WHERE st.transaction_type = 'sale'
    AND st.sku = p_sku
    AND (p_from IS NULL OR st.transaction_date >= p_from)
    AND (p_to   IS NULL OR st.transaction_date <= p_to)
  GROUP BY st.transaction_date, st.sku
  ORDER BY st.transaction_date
$$;

GRANT EXECUTE ON FUNCTION get_sales_by_sku(text, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sales_by_sku(text, date, date) TO anon;
