-- Drop sales_transactions.area and fix the sync trigger that still references it.
--
-- History:
--   20260209000000 added area as a denormalized copy of branch.
--   20260312010000 created trg_sync_sales_transaction_branch_column which syncs
--                  NEW.branch ↔ NEW.area on every INSERT/UPDATE.
--   20260520000001 attempted to drop area with an IF EXISTS guard (may or may not
--                  have executed depending on remote schema state at that time).
--
-- If the area column still exists on the remote, the trigger fires and maintains it.
-- If it was already dropped, the trigger would error on every write — so this
-- migration cleans up the trigger first regardless of column state.

-- 1. Replace the sync function to only handle branch (remove all area references).
--    This is safe whether or not the area column still exists because we drop it next.
CREATE OR REPLACE FUNCTION public.sync_sales_transaction_branch_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- branch is the canonical column; area alias has been removed.
  RETURN NEW;
END;
$$;

-- 2. Drop the area column if it still exists.
ALTER TABLE public.sales_transactions
  DROP COLUMN IF EXISTS area;
