-- Drop the customers.area alias column and its associated objects.
--
-- History:
--   20260208120000 renamed client_name→dealer_name and branch→area.
--   20260312010000 re-added client_name/branch and created a sync trigger.
--   20260522060000 replaced sync_customer_client_branch_columns() with a no-op
--                  after dealer_name was dropped on the remote DB.
--
-- Dropping dealer_name automatically cascaded to:
--   - customers_dealer_area_sku_date_key UNIQUE (dealer_name, area, sku, pricing_date)
--   - idx_customers_dealer_name
--   - idx_customers_dealer_area
--   - idx_customers_fts_combined (since rebuilt in 20260921040000)
--
-- What remains: the area column and its single-column index, the now-no-op trigger
-- and function, and the missing canonical UNIQUE on (client_name, branch, sku, pricing_date).

-- 1. Drop the (now no-op) sync trigger and function.
DROP TRIGGER IF EXISTS trg_sync_customer_client_branch_columns ON public.customers;
DROP FUNCTION IF EXISTS public.sync_customer_client_branch_columns();

-- 2. Drop any remaining alias-column indexes.
DROP INDEX IF EXISTS idx_customers_area;
DROP INDEX IF EXISTS idx_customers_dealer_name;
DROP INDEX IF EXISTS idx_customers_dealer_area;

-- 3. Deduplicate rows on (client_name, branch, sku, pricing_date).
--    For each duplicate group:
--      - canonical row = the one with the most linked transactions (oldest created_at as tiebreak)
--      - re-link ALL FK references from the duplicate(s) to the canonical row
--      - then delete the now-orphaned duplicate(s)
--    After re-linking, recalculate outstanding so total_amount values stay correct.
DO $$
DECLARE
  grp         RECORD;
  canonical   UUID;
  dup         UUID;
BEGIN
  FOR grp IN
    SELECT client_name, branch, sku, pricing_date
    FROM public.customers
    GROUP BY client_name, branch, sku, pricing_date
    HAVING COUNT(*) > 1
  LOOP
    -- Pick canonical: most transactions first, then oldest row
    SELECT c.id INTO canonical
    FROM public.customers c
    WHERE c.client_name  = grp.client_name
      AND c.branch       = grp.branch
      AND c.sku          = grp.sku
      AND c.pricing_date = grp.pricing_date
    ORDER BY
      (SELECT COUNT(*) FROM public.sales_transactions st WHERE st.customer_id = c.id) DESC,
      c.created_at ASC NULLS LAST
    LIMIT 1;

    FOR dup IN
      SELECT id FROM public.customers
      WHERE client_name  = grp.client_name
        AND branch       = grp.branch
        AND sku          = grp.sku
        AND pricing_date = grp.pricing_date
        AND id          != canonical
    LOOP
      -- Re-link every FK table; use EXECUTE so a missing table is skipped, not fatal.
      BEGIN
        EXECUTE format(
          'UPDATE public.sales_transactions   SET customer_id = %L WHERE customer_id = %L', canonical, dup);
      EXCEPTION WHEN undefined_table THEN NULL; END;
      BEGIN
        EXECUTE format(
          'UPDATE public.factory_payables     SET customer_id = %L WHERE customer_id = %L', canonical, dup);
      EXCEPTION WHEN undefined_table THEN NULL; END;
      BEGIN
        EXECUTE format(
          'UPDATE public.orders               SET customer_id = %L WHERE customer_id = %L', canonical, dup);
      EXCEPTION WHEN undefined_table THEN NULL; END;
      BEGIN
        EXECUTE format(
          'UPDATE public.orders_dispatch      SET customer_id = %L WHERE customer_id = %L', canonical, dup);
      EXCEPTION WHEN undefined_table THEN NULL; END;
      BEGIN
        EXECUTE format(
          'UPDATE public.transport_expenses   SET client_id   = %L WHERE client_id   = %L', canonical, dup);
      EXCEPTION WHEN undefined_table THEN NULL; END;
      BEGIN
        EXECUTE format(
          'UPDATE public.label_purchases      SET client_id   = %L WHERE client_id   = %L', canonical, dup);
      EXCEPTION WHEN undefined_table THEN NULL; END;
      BEGIN
        EXECUTE format(
          'UPDATE public.label_availabilities SET client_id   = %L WHERE client_id   = %L', canonical, dup);
      EXCEPTION WHEN undefined_table THEN NULL; END;
      BEGIN
        EXECUTE format(
          'UPDATE public.client_followup_notes SET customer_id = %L WHERE customer_id = %L', canonical, dup);
      EXCEPTION WHEN undefined_table THEN NULL; END;
      BEGIN
        EXECUTE format(
          'UPDATE public.client_commissions   SET customer_id = %L WHERE customer_id = %L', canonical, dup);
      EXCEPTION WHEN undefined_table THEN NULL; END;
      BEGIN
        EXECUTE format(
          'UPDATE public.payment_reminder_logs SET customer_id = %L WHERE customer_id = %L', canonical, dup);
      EXCEPTION WHEN undefined_table THEN NULL; END;
      BEGIN
        EXECUTE format(
          'UPDATE public.whatsapp_message_logs SET customer_id = %L WHERE customer_id = %L', canonical, dup);
      EXCEPTION WHEN undefined_table THEN NULL; END;
      BEGIN
        EXECUTE format(
          'UPDATE public.invoices             SET customer_id = %L WHERE customer_id = %L', canonical, dup);
      EXCEPTION WHEN undefined_table THEN NULL; END;

      -- customer_assignee has PK = customer_id; move only if canonical has no entry yet
      IF EXISTS (SELECT 1 FROM public.customer_assignee WHERE customer_id = dup) THEN
        IF NOT EXISTS (SELECT 1 FROM public.customer_assignee WHERE customer_id = canonical) THEN
          UPDATE public.customer_assignee SET customer_id = canonical WHERE customer_id = dup;
        ELSE
          DELETE FROM public.customer_assignee WHERE customer_id = dup;
        END IF;
      END IF;

      -- Now safe to delete (no FK references remain, trigger will not block)
      DELETE FROM public.customers WHERE id = dup;
    END LOOP;

    -- Recalculate running outstanding after re-linking
    PERFORM recalculate_outstanding_for_client(grp.client_name, grp.branch);
  END LOOP;
END;
$$;

-- 4. Add the canonical UNIQUE constraint on the real columns (only if absent).
--    The old constraint (dealer_name, area, sku, pricing_date) was cascade-dropped
--    when dealer_name was removed.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.customers'::regclass
      AND conname  = 'customers_client_branch_sku_date_key'
  ) THEN
    ALTER TABLE public.customers
      ADD CONSTRAINT customers_client_branch_sku_date_key
      UNIQUE (client_name, branch, sku, pricing_date);
  END IF;
END;
$$;

-- 5. Drop the area alias column itself.
ALTER TABLE public.customers
  DROP COLUMN IF EXISTS area;
