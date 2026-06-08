-- RPC function that consolidates 8+ sequential Dashboard DB calls into 1 round-trip.
-- Returns all aggregated metrics needed for the Dashboard profit, monthly-sales, and
-- metrics cards so the client never has to make separate full-table scans.
CREATE OR REPLACE FUNCTION get_dashboard_aggregates()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    -- Profitability Summary card values
    'total_sales',        COALESCE((SELECT SUM(amount)       FROM sales_transactions  WHERE transaction_type = 'sale'),       0),
    'factory_payables',   COALESCE((SELECT SUM(amount)       FROM factory_payables    WHERE transaction_type = 'production'), 0),
    'factory_payments',   COALESCE((SELECT SUM(amount)       FROM factory_payables    WHERE transaction_type = 'payment'),   0),
    'transport_expenses', COALESCE((SELECT SUM(amount)       FROM transport_expenses),                                          0),
    'label_expenses',     COALESCE((SELECT SUM(total_amount) FROM label_purchases),                                            0),

    -- Metrics card values
    'total_clients',      COALESCE((SELECT COUNT(*)          FROM customers),                                                  0),
    'recent_transactions',COALESCE((
      SELECT COUNT(*) FROM sales_transactions
      WHERE created_at >= NOW() - INTERVAL '7 days'
    ), 0),

    -- Monthly sales KPIs
    'sale_this_month', COALESCE((
      SELECT SUM(amount) FROM sales_transactions
      WHERE transaction_type = 'sale'
        AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)::date
    ), 0),
    'sale_prev_month', COALESCE((
      SELECT SUM(amount) FROM sales_transactions
      WHERE transaction_type = 'sale'
        AND transaction_date >= (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month')::date
        AND transaction_date <   DATE_TRUNC('month', CURRENT_DATE)::date
    ), 0)
  );
$$;
