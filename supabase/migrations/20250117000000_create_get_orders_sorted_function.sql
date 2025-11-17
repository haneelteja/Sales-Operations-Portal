-- Create get_orders_sorted RPC function
-- This function returns orders sorted by status (pending first) and then by tentative_delivery_date (most recent first)

CREATE OR REPLACE FUNCTION get_orders_sorted()
RETURNS TABLE (
  id UUID,
  client TEXT,
  branch TEXT,
  sku TEXT,
  number_of_cases INTEGER,
  tentative_delivery_date DATE,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
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
    CASE WHEN o.status = 'pending' THEN 1 ELSE 2 END,
    o.tentative_delivery_date DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_orders_sorted() TO authenticated;
GRANT EXECUTE ON FUNCTION get_orders_sorted() TO anon;

