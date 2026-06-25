-- Diagnose Biryanis and More · Ameerpet outstanding

DO $$
DECLARE
  r RECORD;
  v_count INT := 0;
  v_running NUMERIC := 0;
BEGIN
  RAISE NOTICE '=== ALL transactions for Biryanis and More · Ameerpet ===';

  FOR r IN
    SELECT
      st.id,
      st.transaction_date,
      st.transaction_type,
      st.amount,
      st.total_amount,
      st.invoice_id,
      st.created_at
    FROM sales_transactions st
    JOIN customers c ON c.id = st.customer_id
    WHERE c.client_name = 'Biryanis and More'
      AND c.branch      = 'Ameerpet'
    ORDER BY st.transaction_date,
             CASE WHEN st.transaction_type = 'payment' THEN 0 ELSE 1 END,
             st.created_at
  LOOP
    v_count := v_count + 1;
    IF r.transaction_type = 'sale' THEN
      v_running := v_running + r.amount;
    ELSE
      v_running := v_running - r.amount;
    END IF;
    RAISE NOTICE 'Row %: % | % | amt=% | expected_running=% | db_total_amount=% | invoice=%',
      v_count, r.transaction_date, r.transaction_type,
      r.amount, v_running, r.total_amount, r.invoice_id;
  END LOOP;

  RAISE NOTICE 'Total rows: %', v_count;
END;
$$;
