-- Rename client_followups.dealer_name → client_name to align with
-- customers.client_name used everywhere else in the system.
-- "dealer" was legacy terminology that no longer reflects the domain.

ALTER TABLE public.client_followups RENAME COLUMN dealer_name TO client_name;

-- Drop the old unique constraint and index, recreate with the new column name.
ALTER TABLE public.client_followups
  DROP CONSTRAINT IF EXISTS client_followups_dealer_name_branch_key;

ALTER TABLE public.client_followups
  ADD CONSTRAINT client_followups_client_name_branch_key UNIQUE (client_name, branch);

DROP INDEX IF EXISTS public.idx_client_followups_dealer_branch;

CREATE INDEX IF NOT EXISTS idx_client_followups_client_branch
  ON public.client_followups (client_name, branch);
