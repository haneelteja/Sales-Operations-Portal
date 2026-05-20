-- Rename sales_transactions.area to branch for consistency with the rest of the schema.

-- Step 1: Add branch column if it doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales_transactions' AND column_name = 'branch'
  ) THEN
    ALTER TABLE public.sales_transactions ADD COLUMN branch TEXT;
  END IF;
END $$;

-- Step 2: Copy existing area values into branch where branch is still null (only if area column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales_transactions' AND column_name = 'area'
  ) THEN
    UPDATE public.sales_transactions SET branch = area WHERE area IS NOT NULL AND branch IS NULL;
  END IF;
END $$;

-- Step 3: Drop the old area column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales_transactions' AND column_name = 'area'
  ) THEN
    ALTER TABLE public.sales_transactions DROP COLUMN area;
  END IF;
END $$;

-- Step 4: Recreate get_latest_sales_by_client_area using st.branch.
-- Return column is still named 'area' so existing callers need no changes.
DROP FUNCTION IF EXISTS get_latest_sales_by_client_area(JSONB);
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
  SELECT DISTINCT ON (st.customer_id, st.branch)
    st.customer_id,
    st.branch AS area,
    st.sku,
    st.quantity::INTEGER
  FROM sales_transactions st
  WHERE st.transaction_type = 'sale'
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(client_area_pairs) AS elem
      WHERE (elem->>'customer_id')::UUID = st.customer_id
        AND COALESCE(elem->>'area', '') = COALESCE(st.branch, '')
    )
  ORDER BY st.customer_id, st.branch, st.transaction_date DESC NULLS LAST, st.created_at DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION get_latest_sales_by_client_area(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_sales_by_client_area(JSONB) TO anon;
