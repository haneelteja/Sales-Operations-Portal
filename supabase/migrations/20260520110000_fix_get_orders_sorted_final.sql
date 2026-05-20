-- Final fix for get_orders_sorted: safe column references.
-- orders table has: order_date (renamed from date), branch + area (both exist).
-- Use COALESCE(branch, area) for branch. Use order_date directly.
DROP FUNCTION IF EXISTS get_orders_sorted();
CREATE OR REPLACE FUNCTION get_orders_sorted()
RETURNS TABLE (
  id UUID,
  order_date DATE,
  client TEXT,
  branch TEXT,
  sku TEXT,
  number_of_cases INTEGER,
  tentative_delivery_date DATE,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  customer_id UUID
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id,
    o.order_date,
    o.client,
    COALESCE(o.branch, o.area)::TEXT AS branch,
    o.sku,
    o.number_of_cases,
    o.tentative_delivery_date,
    COALESCE(o.status, 'pending')::TEXT,
    o.created_at,
    o.updated_at,
    o.customer_id
  FROM orders o
  ORDER BY o.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_orders_sorted() TO authenticated;
GRANT EXECUTE ON FUNCTION get_orders_sorted() TO anon;
