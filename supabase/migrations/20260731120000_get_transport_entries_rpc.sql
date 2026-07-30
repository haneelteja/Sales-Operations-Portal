-- RPC to return raw transport expense entries for reconciliation.
CREATE OR REPLACE FUNCTION get_transport_entries(
  p_from date DEFAULT NULL,
  p_to   date DEFAULT NULL
)
RETURNS TABLE (
  id                uuid,
  expense_date      date,
  description       text,
  expense_group     text,
  transport_vendor  text,
  amount            numeric
)
SECURITY DEFINER
LANGUAGE sql
STABLE
AS $$
  SELECT
    te.id,
    te.expense_date::date,
    te.description,
    te.expense_group,
    te.transport_vendor,
    te.amount
  FROM transport_expenses te
  WHERE (p_from IS NULL OR te.expense_date::date >= p_from)
    AND (p_to   IS NULL OR te.expense_date::date <= p_to)
  ORDER BY te.expense_date, te.amount
$$;

GRANT EXECUTE ON FUNCTION get_transport_entries(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_transport_entries(date, date) TO anon;
