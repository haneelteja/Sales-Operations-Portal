-- Performance indexes for sales_transactions.
--
-- Problem: recalculate_outstanding_for_client() fires on every INSERT/UPDATE/DELETE
-- and runs a window function over all transactions for a client. Without an index on
-- (customer_id, transaction_date, created_at), each call does a full table scan +
-- sort. For clients with hundreds of transactions this is the single most expensive
-- operation in the system.
--
-- Also: get_receivables_summary(), get_inactive_receivables(), ClientAnalysis, and
-- the email edge function all filter by transaction_type without an index.

CREATE INDEX IF NOT EXISTS idx_st_customer_date
  ON public.sales_transactions (customer_id, transaction_date, created_at);

CREATE INDEX IF NOT EXISTS idx_st_transaction_type
  ON public.sales_transactions (transaction_type);

CREATE INDEX IF NOT EXISTS idx_st_transaction_date
  ON public.sales_transactions (transaction_date);
