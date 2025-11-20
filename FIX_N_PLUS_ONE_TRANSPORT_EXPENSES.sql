-- ==============================================
-- FIX N+1 QUERY PROBLEM IN TRANSPORT EXPENSES
-- Create RPC function to batch fetch latest sales transactions
-- ==============================================

-- Function to get latest sales transaction for multiple client_id + branch pairs
CREATE OR REPLACE FUNCTION get_latest_sales_by_client_branch(
  client_branch_pairs JSONB
)
RETURNS TABLE (
  customer_id UUID,
  branch TEXT,
  sku TEXT,
  quantity INTEGER,
  transaction_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH pairs AS (
    SELECT 
      (pair->>'customer_id')::UUID as customer_id,
      pair->>'branch' as branch
    FROM jsonb_array_elements(client_branch_pairs) AS pair
  ),
  latest_sales AS (
    SELECT DISTINCT ON (st.customer_id, st.branch)
      st.customer_id,
      st.branch,
      st.sku,
      st.quantity,
      st.transaction_date
    FROM sales_transactions st
    INNER JOIN pairs p ON st.customer_id = p.customer_id AND st.branch = p.branch
    WHERE st.transaction_type = 'sale'
      AND st.customer_id IS NOT NULL
      AND st.branch IS NOT NULL
    ORDER BY st.customer_id, st.branch, st.transaction_date DESC, st.created_at DESC
  )
  SELECT * FROM latest_sales;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_latest_sales_by_client_branch(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_sales_by_client_branch(JSONB) TO anon;

-- Test the function
-- SELECT * FROM get_latest_sales_by_client_branch('[
--   {"customer_id": "uuid-here", "branch": "Branch1"},
--   {"customer_id": "uuid-here", "branch": "Branch2"}
-- ]'::jsonb);

