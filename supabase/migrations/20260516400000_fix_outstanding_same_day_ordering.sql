-- Fix same-date ordering: payments must be processed before sales within
-- the same transaction_date so the running total is correct when both
-- appear on the same day.
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
        ORDER BY
          st2.transaction_date,
          CASE WHEN st2.transaction_type = 'payment' THEN 0 ELSE 1 END,
          st2.created_at
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

-- Backfill all clients with the corrected ordering
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT
      COALESCE(c.client_name, c.dealer_name) AS client_name,
      COALESCE(c.branch, c.area)             AS branch
    FROM sales_transactions st
    JOIN customers c ON c.id = st.customer_id
    WHERE COALESCE(c.client_name, c.dealer_name) IS NOT NULL
      AND COALESCE(c.branch, c.area)             IS NOT NULL
  LOOP
    PERFORM recalculate_outstanding_for_client(r.client_name, r.branch);
  END LOOP;
END;
$$;
