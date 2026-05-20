-- Fix recalculate_outstanding_for_client to use only client_name and branch
-- (removes COALESCE fallbacks to dealer_name/area that may not exist)

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
        CASE WHEN st2.transaction_type = 'sale' THEN st2.amount ELSE -st2.amount END
      ) OVER (
        ORDER BY st2.transaction_date, st2.created_at
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) AS running_total
    FROM sales_transactions st2
    JOIN customers c ON c.id = st2.customer_id
    WHERE c.client_name = p_client_name
      AND c.branch = p_branch
  ) sub
  WHERE st.id = sub.id;
END;
$$ LANGUAGE plpgsql;

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

DROP TRIGGER IF EXISTS after_transaction_change ON sales_transactions;
CREATE TRIGGER after_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON sales_transactions
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_outstanding();
