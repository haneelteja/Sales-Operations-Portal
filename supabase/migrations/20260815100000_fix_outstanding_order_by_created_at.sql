-- Change outstanding trigger ordering from (date, payment-before-sale, created_at)
-- to (date, created_at) only.
--
-- Reason: the type-based ordering (payments first) meant the payment row's total_amount
-- was always an intermediate balance, not the final one. When displayed newest-first,
-- the top row showed a confusing intermediate value.
--
-- With pure created_at ordering, the LAST-entered transaction for a date always holds
-- the final running balance. The display (also sorted created_at DESC) then shows the
-- current outstanding in the top row — unambiguous.

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

-- Backfill all clients with the new ordering
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
