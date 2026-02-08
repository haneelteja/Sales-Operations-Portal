-- ==============================================
-- OPTIMIZED RECEIVABLES CALCULATION FUNCTION
-- ==============================================
-- This function calculates customer receivables efficiently
-- using database-level aggregation instead of client-side processing
-- Expected impact: 60-80% reduction in query time
-- ==============================================

CREATE OR REPLACE FUNCTION get_customer_receivables()
RETURNS TABLE (
  customer_id uuid,
  customer_name text,
  branch text,
  total_sales numeric,
  total_payments numeric,
  outstanding numeric,
  transaction_count bigint
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH customer_totals AS (
    SELECT 
      st.customer_id,
      COUNT(*) as transaction_count,
      SUM(CASE WHEN st.transaction_type = 'sale' THEN COALESCE(st.amount, 0) ELSE 0 END) as total_sales,
      SUM(CASE WHEN st.transaction_type = 'payment' THEN COALESCE(st.amount, 0) ELSE 0 END) as total_payments
    FROM sales_transactions st
    GROUP BY st.customer_id
  )
  SELECT 
    c.id as customer_id,
    c.client_name as customer_name,
    c.branch,
    COALESCE(ct.total_sales, 0) as total_sales,
    COALESCE(ct.total_payments, 0) as total_payments,
    COALESCE(ct.total_sales, 0) - COALESCE(ct.total_payments, 0) as outstanding,
    COALESCE(ct.transaction_count, 0) as transaction_count
  FROM customers c
  LEFT JOIN customer_totals ct ON c.id = ct.customer_id
  WHERE c.is_active = true
    AND (COALESCE(ct.total_sales, 0) - COALESCE(ct.total_payments, 0) > 0)
  ORDER BY outstanding DESC;
END;
$$;

-- ==============================================
-- OPTIMIZED ORDERS SORTING FUNCTION
-- ==============================================
-- Sorts orders by status (pending first) and delivery date
-- Drop first so return type can change (date column added)
-- ==============================================
DROP FUNCTION IF EXISTS get_orders_sorted() CASCADE;

CREATE OR REPLACE FUNCTION get_orders_sorted()
RETURNS TABLE (
  id uuid,
  date date,
  client text,
  branch text,
  sku text,
  number_of_cases integer,
  tentative_delivery_date date,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.date,
    o.client,
    o.branch,
    o.sku,
    o.number_of_cases,
    o.tentative_delivery_date,
    o.status,
    o.created_at,
    o.updated_at
  FROM orders o
  ORDER BY 
    CASE WHEN o.status = 'pending' THEN 0 ELSE 1 END, -- pending first
    o.tentative_delivery_date DESC NULLS LAST;
END;
$$;

-- ==============================================
-- DASHBOARD METRICS FUNCTION
-- ==============================================
-- Calculates dashboard metrics in a single query
-- Expected impact: 70-90% reduction in query count
-- ==============================================

CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS TABLE (
  total_clients bigint,
  total_outstanding numeric,
  factory_outstanding numeric,
  high_value_customers bigint,
  recent_transactions bigint
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  seven_days_ago timestamp with time zone;
BEGIN
  seven_days_ago := NOW() - INTERVAL '7 days';
  
  RETURN QUERY
  WITH client_stats AS (
    SELECT 
      COUNT(DISTINCT c.id) as total_clients,
      COUNT(DISTINCT CASE WHEN r.outstanding > 50000 THEN c.id END) as high_value_customers
    FROM customers c
    LEFT JOIN LATERAL (
      SELECT 
        SUM(CASE WHEN st.transaction_type = 'sale' THEN COALESCE(st.amount, 0) ELSE 0 END) -
        SUM(CASE WHEN st.transaction_type = 'payment' THEN COALESCE(st.amount, 0) ELSE 0 END) as outstanding
      FROM sales_transactions st
      WHERE st.customer_id = c.id
    ) r ON true
    WHERE c.is_active = true
  ),
  receivables_total AS (
    SELECT 
      COALESCE(SUM(
        CASE WHEN st.transaction_type = 'sale' THEN COALESCE(st.amount, 0) ELSE 0 END
      ) - SUM(
        CASE WHEN st.transaction_type = 'payment' THEN COALESCE(st.amount, 0) ELSE 0 END
      ), 0) as total_outstanding
    FROM sales_transactions st
    INNER JOIN customers c ON st.customer_id = c.id
    WHERE c.is_active = true
  ),
  factory_stats AS (
    SELECT 
      COALESCE(SUM(
        CASE WHEN fp.transaction_type = 'production' THEN COALESCE(fp.amount, 0) ELSE 0 END
      ) - SUM(
        CASE WHEN fp.transaction_type = 'payment' THEN COALESCE(fp.amount, 0) ELSE 0 END
      ), 0) as factory_outstanding
    FROM factory_payables fp
  ),
  recent_txns AS (
    SELECT COUNT(*) as recent_transactions
    FROM sales_transactions
    WHERE created_at >= seven_days_ago
  )
  SELECT 
    cs.total_clients,
    rt.total_outstanding,
    fs.factory_outstanding,
    cs.high_value_customers,
    rtx.recent_transactions
  FROM client_stats cs
  CROSS JOIN receivables_total rt
  CROSS JOIN factory_stats fs
  CROSS JOIN recent_txns rtx;
END;
$$;

-- ==============================================
-- GRANT PERMISSIONS
-- ==============================================

GRANT EXECUTE ON FUNCTION get_customer_receivables() TO authenticated;
GRANT EXECUTE ON FUNCTION get_orders_sorted() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics() TO authenticated;

-- ==============================================
-- VERIFICATION
-- ==============================================
-- Test the functions:
-- 
-- SELECT * FROM get_customer_receivables();
-- SELECT * FROM get_orders_sorted();
-- SELECT * FROM get_dashboard_metrics();

