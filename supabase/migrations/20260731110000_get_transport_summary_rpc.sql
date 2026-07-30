-- RPC to aggregate transport expenses by month for reconciliation.
CREATE OR REPLACE FUNCTION get_transport_summary()
RETURNS TABLE (
  year_month   text,
  total_amount numeric,
  entry_count  bigint
)
SECURITY DEFINER
LANGUAGE sql
STABLE
AS $$
  SELECT
    to_char(te.expense_date, 'YYYY-MM') AS year_month,
    COALESCE(SUM(te.amount), 0)         AS total_amount,
    COUNT(*)                            AS entry_count
  FROM transport_expenses te
  GROUP BY to_char(te.expense_date, 'YYYY-MM')
  ORDER BY year_month
$$;

GRANT EXECUTE ON FUNCTION get_transport_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_transport_summary() TO anon;
