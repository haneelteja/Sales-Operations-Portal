-- Fix outstanding recalculation:
-- 1. Restore payment-before-sale ordering within the same transaction_date
--    (was lost in 20260520000002_fix_outstanding_trigger_column_names.sql)
-- 2. Full backfill across every client+branch so all existing total_amount
--    values are correct regardless of when they were originally inserted.

-- ── Core recalculation function ───────────────────────────────────────────────
-- Ordering: transaction_date ASC → payments before sales on the same date →
-- created_at ASC (tie-break by insertion order).
CREATE OR REPLACE FUNCTION recalculate_outstanding_for_client(
  p_client_name TEXT,
  p_branch      TEXT
) RETURNS void AS $$
BEGIN
  UPDATE sales_transactions st
  SET total_amount = sub.running_total
  FROM (
    SELECT
      st2.id,
      SUM(
        CASE WHEN st2.transaction_type = 'sale' THEN st2.amount ELSE -st2.amount END
      ) OVER (
        ORDER BY
          st2.transaction_date,
          CASE WHEN st2.transaction_type = 'payment' THEN 0 ELSE 1 END,
          st2.created_at
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) AS running_total
    FROM sales_transactions st2
    JOIN customers c ON c.id = st2.customer_id
    WHERE c.client_name = p_client_name
      AND c.branch      = p_branch
  ) sub
  WHERE st.id = sub.id;
END;
$$ LANGUAGE plpgsql;

-- ── Trigger function ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_recalculate_outstanding()
RETURNS TRIGGER AS $$
DECLARE
  v_client_name TEXT;
  v_branch      TEXT;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'DELETE' THEN
    SELECT c.client_name, c.branch
    INTO v_client_name, v_branch
    FROM customers c WHERE c.id = OLD.customer_id;
  ELSE
    SELECT c.client_name, c.branch
    INTO v_client_name, v_branch
    FROM customers c WHERE c.id = NEW.customer_id;
  END IF;

  IF v_client_name IS NOT NULL AND v_branch IS NOT NULL THEN
    PERFORM recalculate_outstanding_for_client(v_client_name, v_branch);
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ── Re-attach trigger ─────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS after_transaction_change ON sales_transactions;
CREATE TRIGGER after_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON sales_transactions
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_outstanding();

-- ── Full backfill ─────────────────────────────────────────────────────────────
-- Recalculate every client+branch so all existing rows have correct values.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT c.client_name, c.branch
    FROM sales_transactions st
    JOIN customers c ON c.id = st.customer_id
    WHERE c.client_name IS NOT NULL
      AND c.branch      IS NOT NULL
  LOOP
    PERFORM recalculate_outstanding_for_client(r.client_name, r.branch);
  END LOOP;
END;
$$;
