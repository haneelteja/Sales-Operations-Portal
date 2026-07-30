-- RPC to expose raw factory_payables rows for admin reconciliation.
-- Returns production and payment transactions ordered by date.
CREATE OR REPLACE FUNCTION get_factory_transactions(
  p_from date DEFAULT NULL,
  p_to   date DEFAULT NULL
)
RETURNS TABLE (
  id               uuid,
  transaction_date date,
  transaction_type text,
  sku              text,
  quantity         numeric,
  amount           numeric,
  description      text
)
SECURITY DEFINER
LANGUAGE sql
STABLE
AS $$
  SELECT
    fp.id,
    fp.transaction_date,
    fp.transaction_type,
    fp.sku,
    fp.quantity,
    fp.amount,
    fp.description
  FROM factory_payables fp
  WHERE fp.transaction_type IN ('production', 'payment')
    AND (p_from IS NULL OR fp.transaction_date >= p_from)
    AND (p_to   IS NULL OR fp.transaction_date <= p_to)
  ORDER BY fp.transaction_date, fp.transaction_type
$$;

GRANT EXECUTE ON FUNCTION get_factory_transactions(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_factory_transactions(date, date) TO anon;
