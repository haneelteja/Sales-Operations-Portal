-- Root cause fix: sales_transactions.branch out of sync with customers.branch
-- The recalculate trigger uses customer.branch; the UI display uses tx.branch first.
-- Any row where they differ becomes invisible in the UI but still affects the balance.
-- Fix: update tx.branch to match the customer's branch wherever they diverge.

DO $$
DECLARE
  r RECORD;
  v_total INT := 0;
BEGIN
  RAISE NOTICE '=== Mismatched branch rows ===';

  FOR r IN
    SELECT
      st.id,
      st.transaction_date,
      st.transaction_type,
      st.amount,
      st.branch        AS tx_branch,
      c.client_name,
      c.branch         AS cust_branch
    FROM sales_transactions st
    JOIN customers c ON c.id = st.customer_id
    WHERE (st.branch IS DISTINCT FROM c.branch)
      AND c.client_name IS NOT NULL
      AND c.branch IS NOT NULL
    ORDER BY c.client_name, c.branch, st.transaction_date
  LOOP
    RAISE NOTICE 'client=% | date=% | type=% | amt=% | tx_branch=% → cust_branch=%',
      r.client_name, r.transaction_date, r.transaction_type,
      r.amount, r.tx_branch, r.cust_branch;
    v_total := v_total + 1;
  END LOOP;

  RAISE NOTICE 'Total mismatched rows: %', v_total;

  -- Fix: set tx.branch = customer.branch for all mismatched rows
  UPDATE sales_transactions st
  SET branch = c.branch
  FROM customers c
  WHERE st.customer_id = c.id
    AND (st.branch IS DISTINCT FROM c.branch)
    AND c.branch IS NOT NULL;

  GET DIAGNOSTICS v_total = ROW_COUNT;
  RAISE NOTICE 'Fixed % rows. Running full outstanding backfill...', v_total;

  -- Backfill all affected client+branch pairs
  DECLARE r2 RECORD;
  BEGIN
    FOR r2 IN
      SELECT DISTINCT c.client_name, c.branch
      FROM sales_transactions st
      JOIN customers c ON c.id = st.customer_id
      WHERE c.client_name IS NOT NULL AND c.branch IS NOT NULL
    LOOP
      PERFORM recalculate_outstanding_for_client(r2.client_name, r2.branch);
    END LOOP;
    RAISE NOTICE 'Backfill complete.';
  END;
END;
$$;
