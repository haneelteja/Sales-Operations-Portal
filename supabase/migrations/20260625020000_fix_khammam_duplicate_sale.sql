-- Fix: delete duplicate 2026-03-24 ₹64,800 sale for Biryanis and More · Khammam
-- Keep the row with an invoice_id (INV-734); delete the one without.

DO $$
DECLARE
  v_del_id UUID;
BEGIN
  -- Both rows have invoice_id — pick the one created latest (likely the accidental re-entry)
  SELECT st.id INTO v_del_id
  FROM sales_transactions st
  JOIN customers c ON c.id = st.customer_id
  WHERE c.client_name       = 'Biryanis and More'
    AND c.branch             = 'Khammam'
    AND st.transaction_date  = '2026-03-24'
    AND st.transaction_type  = 'sale'
    AND st.amount            = 64800
  ORDER BY st.created_at DESC
  LIMIT 1;

  IF v_del_id IS NOT NULL THEN
    RAISE NOTICE 'Deleting duplicate sale id=%', v_del_id;
    DELETE FROM sales_transactions WHERE id = v_del_id;
    PERFORM recalculate_outstanding_for_client('Biryanis and More', 'Khammam');
    RAISE NOTICE 'Done — outstanding recalculated.';
  ELSE
    RAISE NOTICE 'No duplicate found.';
  END IF;
END;
$$;
