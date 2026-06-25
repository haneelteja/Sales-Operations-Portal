-- Full outstanding backfill (2026-06-25)
-- Re-runs recalculate_outstanding_for_client for every client+branch pair.
-- The function uses the correct ordering:
--   transaction_date ASC → payment before sale on same date → created_at ASC
-- Safe to run multiple times (idempotent).

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
      AND c.branch      IS NOT NULL
    ORDER BY c.client_name, c.branch
  LOOP
    PERFORM recalculate_outstanding_for_client(r.client_name, r.branch);
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE 'Backfilled % client+branch pairs', v_count;
END;
$$;
