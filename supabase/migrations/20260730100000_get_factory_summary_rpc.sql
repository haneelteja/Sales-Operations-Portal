-- RPC to aggregate factory payables by month for comparison against Elma ledger.
-- Uses stored amount values (quantity × price_per_case at time of entry).
CREATE OR REPLACE FUNCTION get_factory_summary()
RETURNS TABLE (
  year_month       text,
  production_cases numeric,
  total_production numeric,
  total_payments   numeric,
  net_outstanding  numeric
)
SECURITY DEFINER
LANGUAGE sql
STABLE
AS $$
  SELECT
    to_char(fp.transaction_date, 'YYYY-MM')                                                                  AS year_month,
    COALESCE(SUM(CASE WHEN fp.transaction_type = 'production' THEN fp.quantity ELSE 0 END), 0)              AS production_cases,
    COALESCE(SUM(CASE WHEN fp.transaction_type = 'production' THEN fp.amount  ELSE 0 END), 0)              AS total_production,
    COALESCE(SUM(CASE WHEN fp.transaction_type = 'payment'    THEN fp.amount  ELSE 0 END), 0)              AS total_payments,
    COALESCE(SUM(CASE WHEN fp.transaction_type = 'production' THEN  fp.amount
                      WHEN fp.transaction_type = 'payment'    THEN -fp.amount
                      ELSE 0 END), 0)                                                                        AS net_outstanding
  FROM factory_payables fp
  WHERE fp.transaction_type IN ('production', 'payment')
  GROUP BY to_char(fp.transaction_date, 'YYYY-MM')
  ORDER BY year_month
$$;

GRANT EXECUTE ON FUNCTION get_factory_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_factory_summary() TO anon;
