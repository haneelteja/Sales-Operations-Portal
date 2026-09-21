-- Optimize recalculate_outstanding_for_client() to use the new indexes.
--
-- Problem (current implementation):
--   1. The trigger calls SELECT client_name, branch FROM customers WHERE id = NEW.customer_id
--      then passes those to recalculate_outstanding_for_client(TEXT, TEXT).
--   2. That function does: FROM sales_transactions JOIN customers ON customer_id = id
--      WHERE client_name = X AND branch = Y — a JOIN that cannot use idx_st_customer_date
--      because the planner must resolve the JOIN before applying the WHERE.
--
-- Fix:
--   A. Add a UUID overload: trigger passes NEW.customer_id directly, eliminating
--      the extra SELECT. The UUID variant does a single PK lookup then calls
--      the shared IN-subquery implementation.
--   B. Rewrite both variants to use WHERE customer_id IN (SELECT id FROM customers ...)
--      instead of a JOIN. This lets the planner use idx_st_customer_date for the
--      outer scan and idx_customers_client_branch for the inner subquery.
--   C. Keep the (TEXT, TEXT) signature unchanged — ConfigurationManagement.tsx calls
--      this RPC directly with p_client_name / p_branch.

-- ── Optimized TEXT variant ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.recalculate_outstanding_for_client(
  p_client_name TEXT,
  p_branch      TEXT
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_opening_balance NUMERIC;
BEGIN
  SELECT COALESCE(MAX(opening_balance), 0)
  INTO   v_opening_balance
  FROM   public.customers
  WHERE  client_name = p_client_name
    AND  branch      = p_branch;

  UPDATE public.sales_transactions st
  SET    total_amount = sub.running_total + v_opening_balance
  FROM (
    SELECT
      st2.id,
      SUM(
        CASE WHEN st2.transaction_type = 'sale' THEN st2.amount ELSE -st2.amount END
      ) OVER (
        ORDER BY
          st2.transaction_date,
          st2.created_at
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) AS running_total
    FROM   public.sales_transactions st2
    -- IN-subquery lets the planner use idx_st_customer_date + idx_customers_client_branch
    WHERE  st2.customer_id IN (
      SELECT id FROM public.customers
      WHERE  client_name = p_client_name
        AND  branch      = p_branch
    )
  ) sub
  WHERE st.id = sub.id;
END;
$$;

-- ── UUID overload (used by the trigger) ───────────────────────────────────────
-- The trigger passes NEW.customer_id directly — no preliminary SELECT needed.
CREATE OR REPLACE FUNCTION public.recalculate_outstanding_for_client(
  p_customer_id UUID
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_client_name     TEXT;
  v_branch          TEXT;
  v_opening_balance NUMERIC;
BEGIN
  -- Single PK lookup — O(1)
  SELECT client_name, branch
  INTO   v_client_name, v_branch
  FROM   public.customers
  WHERE  id = p_customer_id;

  IF v_client_name IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(MAX(opening_balance), 0)
  INTO   v_opening_balance
  FROM   public.customers
  WHERE  client_name = v_client_name
    AND  branch      = v_branch;

  UPDATE public.sales_transactions st
  SET    total_amount = sub.running_total + v_opening_balance
  FROM (
    SELECT
      st2.id,
      SUM(
        CASE WHEN st2.transaction_type = 'sale' THEN st2.amount ELSE -st2.amount END
      ) OVER (
        ORDER BY
          st2.transaction_date,
          st2.created_at
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) AS running_total
    FROM   public.sales_transactions st2
    WHERE  st2.customer_id IN (
      SELECT id FROM public.customers
      WHERE  client_name = v_client_name
        AND  branch      = v_branch
    )
  ) sub
  WHERE st.id = sub.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalculate_outstanding_for_client(UUID)
  TO authenticated, anon;

-- ── Optimized trigger function ────────────────────────────────────────────────
-- Passes customer_id directly to the UUID overload — no preliminary SELECT.
CREATE OR REPLACE FUNCTION public.trigger_recalculate_outstanding()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.customer_id IS NOT NULL THEN
      PERFORM public.recalculate_outstanding_for_client(OLD.customer_id);
    END IF;
  ELSE
    IF NEW.customer_id IS NOT NULL THEN
      PERFORM public.recalculate_outstanding_for_client(NEW.customer_id);
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

-- Re-attach the trigger (idempotent)
DROP TRIGGER IF EXISTS after_transaction_change ON public.sales_transactions;
CREATE TRIGGER after_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.sales_transactions
FOR EACH ROW EXECUTE FUNCTION public.trigger_recalculate_outstanding();
