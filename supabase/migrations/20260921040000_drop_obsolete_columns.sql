-- Remove columns that are confirmed unused in all application code, RPC functions,
-- and triggers, reducing table width and eliminating confusion from dead fields.
--
-- Columns dropped:
--   customers.is_deprecated       — merged into is_active by 20260817100000; nothing reads it
--   customers.contact_person      — present since initial setup; no UI, no RPC references
--   customers.phone               — same; whatsapp_number is the canonical contact field
--   customers.email               — same
--   customers.address             — same
--
-- The customers FTS index (idx_customers_fts_combined) currently includes
-- contact_person, email, and phone. It is dropped and recreated without them.
--
-- All DROP COLUMN statements use IF EXISTS guards so this migration is safe to run
-- even if a prior migration already removed the column.

-- Rebuild the FTS index before touching columns so the index definition is never
-- pointing at columns we are about to drop.
DROP INDEX IF EXISTS idx_customers_fts_combined;
CREATE INDEX idx_customers_fts_combined
  ON public.customers
  USING GIN (
    to_tsvector('simple',
      COALESCE(client_name, '') || ' ' ||
      COALESCE(branch, '')
    )
  );

-- Drop dead columns from customers.
ALTER TABLE public.customers
  DROP COLUMN IF EXISTS is_deprecated,
  DROP COLUMN IF EXISTS contact_person,
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS address;

-- Add a supporting index for label_purchases default sort (purchase_date DESC).
-- Queries in LabelPurchases.tsx order by purchase_date; without this index
-- PostgREST must sort the full table on every page load.
CREATE INDEX IF NOT EXISTS idx_label_purchases_date
  ON public.label_purchases (purchase_date DESC NULLS LAST);
