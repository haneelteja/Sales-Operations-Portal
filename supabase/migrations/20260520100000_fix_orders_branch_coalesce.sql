-- Fix get_orders_sorted to read branch with fallback to area,
-- since orders table has both columns and old rows store the value in area.
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    COALESCE(o.order_date, o.date) AS order_date,
    o.client,
    COALESCE(o.branch, o.area) AS branch,
    o.sku,
    o.number_of_cases,
    o.tentative_delivery_date,
    COALESCE(o.status, 'pending')::TEXT,
    o.created_at,
    o.updated_at,
    o.customer_id
  FROM orders o
  ORDER BY o.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_orders_sorted() TO authenticated;
GRANT EXECUTE ON FUNCTION get_orders_sorted() TO anon;

-- Also backfill branch from area for any rows where branch is still null
UPDATE public.orders
SET branch = area
WHERE branch IS NULL AND area IS NOT NULL;
