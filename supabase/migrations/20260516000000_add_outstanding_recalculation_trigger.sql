-- Recalculate running outstanding (total_amount) for a client+branch.
-- Called by the trigger below and used for the one-time backfill.
CREATE OR REPLACE FUNCTION recalculate_outstanding_for_client(
  p_client_name TEXT,
  p_branch TEXT
) RETURNS void AS $$
BEGIN
  UPDATE sales_transactions st
  SET total_amount = sub.running_total
  FROM (
    SELECT
      st2.id,
      SUM(
        CASE WHEN st2.type = 'sale' THEN st2.amount ELSE -st2.amount END
      ) OVER (
        ORDER BY st2.transaction_date, st2.created_at
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) AS running_total
    FROM sales_transactions st2
    JOIN customers c ON c.id = st2.customer_id
    WHERE COALESCE(c.client_name, c.dealer_name) = p_client_name
      AND COALESCE(c.branch, c.area) = p_branch
  ) sub
  WHERE st.id = sub.id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function: fires after every INSERT / UPDATE / DELETE on sales_transactions.
-- pg_trigger_depth() > 1 prevents infinite recursion when the UPDATE inside this
-- function fires the trigger again for the rows it touches.
CREATE OR REPLACE FUNCTION trigger_recalculate_outstanding()
RETURNS TRIGGER AS $$
DECLARE
  v_client_name TEXT;
  v_branch TEXT;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'DELETE' THEN
    SELECT COALESCE(c.client_name, c.dealer_name), COALESCE(c.branch, c.area)
    INTO v_client_name, v_branch
    FROM customers c WHERE c.id = OLD.customer_id;
  ELSE
    SELECT COALESCE(c.client_name, c.dealer_name), COALESCE(c.branch, c.area)
    INTO v_client_name, v_branch
    FROM customers c WHERE c.id = NEW.customer_id;
  END IF;

  IF v_client_name IS NOT NULL AND v_branch IS NOT NULL THEN
    PERFORM recalculate_outstanding_for_client(v_client_name, v_branch);
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger (drop first to allow re-running this migration safely)
DROP TRIGGER IF EXISTS after_transaction_change ON sales_transactions;
CREATE TRIGGER after_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON sales_transactions
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_outstanding();

-- One-time backfill: recalculate every client+branch so all existing rows
-- (including Biryanis and More Ongole) have correct total_amount values.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT
      COALESCE(c.client_name, c.dealer_name) AS client_name,
      COALESCE(c.branch, c.area) AS branch
    FROM sales_transactions st
    JOIN customers c ON c.id = st.customer_id
    WHERE COALESCE(c.client_name, c.dealer_name) IS NOT NULL
      AND COALESCE(c.branch, c.area) IS NOT NULL
  LOOP
    PERFORM recalculate_outstanding_for_client(r.client_name, r.branch);
  END LOOP;
END;
$$;
