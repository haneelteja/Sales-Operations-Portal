-- Diagnose extra ₹64,800 in Biryanis and More · Khammam outstanding

DO $$
DECLARE
  r RECORD;
  v_count INT := 0;
BEGIN
  RAISE NOTICE '=== ALL transactions counted by recalculate_outstanding_for_client ===';
  RAISE NOTICE '(joins on customer.client_name + customer.branch)';
  RAISE NOTICE '';

  FOR r IN
    SELECT
      st.id,
      st.transaction_date,
      st.transaction_type,
      st.amount,
      st.branch AS tx_branch,
      c.branch  AS cust_branch,
      st.created_at
    FROM sales_transactions st
    JOIN customers c ON c.id = st.customer_id
    WHERE c.client_name = 'Biryanis and More'
      AND c.branch      = 'Khammam'
    ORDER BY st.transaction_date,
             CASE WHEN st.transaction_type = 'payment' THEN 0 ELSE 1 END,
             st.created_at
  LOOP
    v_count := v_count + 1;
    RAISE NOTICE 'Row %: % | % | amt=% | tx_branch=% | cust_branch=%',
      v_count,
      r.transaction_date,
      r.transaction_type,
      r.amount,
      r.tx_branch,
      r.cust_branch;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Total rows in recalculate scope: %', v_count;
END;
$$;
