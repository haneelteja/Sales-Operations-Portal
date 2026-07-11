-- RPC: get_client_officer_first_sales
-- Returns the first sale date per officer-client mapping.
-- Falls back to assigned_at when no sales transactions exist for a client.
CREATE OR REPLACE FUNCTION public.get_client_officer_first_sales()
RETURNS TABLE(client_name TEXT, branch TEXT, officer_id UUID, first_sale_date DATE)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cso.client_name,
    cso.branch,
    cso.officer_id,
    COALESCE(
      MIN(st.transaction_date)::DATE,
      cso.assigned_at::DATE
    ) AS first_sale_date
  FROM customer_sales_officer cso
  LEFT JOIN customers c
    ON c.client_name = cso.client_name
    AND COALESCE(c.branch, '') = COALESCE(cso.branch, '')
  LEFT JOIN sales_transactions st
    ON st.customer_id = c.id
    AND st.transaction_type = 'sale'
  GROUP BY cso.client_name, cso.branch, cso.officer_id, cso.assigned_at
$$;

GRANT EXECUTE ON FUNCTION public.get_client_officer_first_sales() TO anon, authenticated;
