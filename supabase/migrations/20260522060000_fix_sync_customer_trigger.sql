-- The sync_customer_client_branch_columns trigger was written when customers
-- still had dealer_name and area columns. Those columns have since been dropped,
-- causing every INSERT to fail with "record NEW has no field dealer_name".
-- Replace the function body to only reference columns that still exist.

CREATE OR REPLACE FUNCTION public.sync_customer_client_branch_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN NEW;
END;
$$;
