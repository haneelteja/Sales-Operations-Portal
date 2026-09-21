-- Performance indexes for the customers table.
--
-- is_active: virtually every query filters active customers (SalesEntry, AddClientDialog,
-- ConfigurationManagement, get_customer_outstanding). Without this index, PostgREST
-- must scan the full table.
--
-- (client_name, branch): used in WHERE clauses across recalculate_outstanding_for_client(),
-- get_receivables_summary(), get_customer_outstanding(), and multiple client-side queries
-- that resolve customer_id from a (name, branch) pair. The existing indexes are on
-- (dealer_name, area) which are alias columns; client_name/branch need their own index.

CREATE INDEX IF NOT EXISTS idx_customers_is_active
  ON public.customers (is_active);

CREATE INDEX IF NOT EXISTS idx_customers_client_branch
  ON public.customers (client_name, branch);
