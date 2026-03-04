-- RPC for batch fetching latest sales by client_id + area (fixes N+1 in TransportExpenses)
-- Accepts JSONB array of {customer_id, area} pairs

CREATE OR REPLACE FUNCTION get_latest_sales_by_client_area(client_area_pairs JSONB)
RETURNS TABLE (
  customer_id UUID,
  area TEXT,
  sku TEXT,
  quantity INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (st.customer_id, st.area)
    st.customer_id,
    st.area,
    st.sku,
    st.quantity::INTEGER
  FROM sales_transactions st
  WHERE st.transaction_type = 'sale'
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(client_area_pairs) AS elem
      WHERE (elem->>'customer_id')::UUID = st.customer_id
        AND COALESCE(elem->>'area', '') = COALESCE(st.area, '')
    )
  ORDER BY st.customer_id, st.area, st.transaction_date DESC NULLS LAST, st.created_at DESC NULLS LAST;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_latest_sales_by_client_area(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_sales_by_client_area(JSONB) TO anon;
