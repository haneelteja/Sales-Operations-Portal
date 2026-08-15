-- Update recalculate_outstanding_for_client to offset total_amount by opening_balance.
-- This makes total_amount on every transaction reflect the true historical balance,
-- so the ledger export opening balance formula (total_amount[0] - contribution[0])
-- automatically returns the correct pre-portal balance.

CREATE OR REPLACE FUNCTION recalculate_outstanding_for_client(
  p_client_name TEXT,
  p_branch TEXT
) RETURNS void AS $$
DECLARE
  v_opening_balance numeric;
BEGIN
  -- Use MAX so any row with the correct opening_balance is picked up
  SELECT COALESCE(MAX(opening_balance), 0) INTO v_opening_balance
  FROM customers
  WHERE client_name = p_client_name
    AND branch = p_branch;

  UPDATE sales_transactions st
  SET total_amount = sub.running_total + v_opening_balance
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
    FROM sales_transactions st2
    JOIN customers c ON c.id = st2.customer_id
    WHERE c.client_name = p_client_name
      AND c.branch = p_branch
  ) sub
  WHERE st.id = sub.id;
END;
$$ LANGUAGE plpgsql;

-- Backfill all clients with the new formula
-- (opening_balance = 0 for all existing clients, so no change in values today;
--  future edits to opening_balance will trigger a manual recalculation)
DO $$
DECLARE
  r RECORD;
  v_count INT := 0;
BEGIN
  FOR r IN
    SELECT DISTINCT c.client_name, c.branch
    FROM sales_transactions st
    JOIN customers c ON c.id = st.customer_id
    WHERE c.client_name IS NOT NULL
      AND c.branch IS NOT NULL
    ORDER BY c.client_name, c.branch
  LOOP
    PERFORM recalculate_outstanding_for_client(r.client_name, r.branch);
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'Backfilled % client+branch pairs', v_count;
END;
$$;
