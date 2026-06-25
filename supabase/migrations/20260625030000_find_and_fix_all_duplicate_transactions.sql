-- Find and fix ALL duplicate transactions across all clients.
-- A duplicate = same (customer_id, transaction_date, transaction_type, amount)
-- with more than one row. Keep the earliest created_at; delete the rest.

DO $$
DECLARE
  r        RECORD;
  v_total  INT := 0;
BEGIN
  FOR r IN
    SELECT
      st.customer_id,
      st.transaction_date,
      st.transaction_type,
      st.amount,
      COUNT(*) AS cnt,
      MIN(st.created_at) AS keep_created_at
    FROM sales_transactions st
    GROUP BY st.customer_id, st.transaction_date, st.transaction_type, st.amount
    HAVING COUNT(*) > 1
  LOOP
    RAISE NOTICE 'Duplicate: customer_id=% date=% type=% amount=% count=%',
      r.customer_id, r.transaction_date, r.transaction_type, r.amount, r.cnt;

    -- Delete all but the earliest-created row
    DELETE FROM sales_transactions
    WHERE customer_id       = r.customer_id
      AND transaction_date  = r.transaction_date
      AND transaction_type  = r.transaction_type
      AND amount            = r.amount
      AND created_at        > r.keep_created_at;

    v_total := v_total + (r.cnt - 1);
  END LOOP;

  RAISE NOTICE 'Total duplicate rows deleted: %', v_total;

  -- Re-run full backfill to fix all affected outstandings
  IF v_total > 0 THEN
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
      RAISE NOTICE 'Full outstanding backfill complete.';
    END;
  END IF;
END;
$$;
