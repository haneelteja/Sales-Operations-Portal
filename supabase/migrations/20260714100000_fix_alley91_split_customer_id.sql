-- Fix: Alley 91 Nanakramguda outstanding discrepancy
--
-- Root cause: The 7/9/2026 payment (₹16,495) was saved against a DIFFERENT
-- customer_id than all the Alley 91 Nanakramguda sales.
--
-- • Client Transactions and the trigger both match by client_name + branch (text)
--   so they see all transactions together → show the correct ₹16,750 balance.
-- • get_receivables_summary groups by customer_id (UUID) → produces two rows:
--     UUID-A (sales only)   outstanding = ₹33,245  → shown
--     UUID-B (payment only) outstanding = −₹16,495 → skipped (< 0.01 filter)
-- Result: Receivables Tracker shows ₹33,245 instead of the correct ₹16,750.
--
-- Fix: move every transaction on any secondary Alley 91 / Nanakramguda
-- customer record onto the primary (the one that holds the sales), then
-- recalculate outstanding for that client+branch.

DO $$
DECLARE
  v_primary_id   UUID;
  v_secondary_id UUID;
  v_updated      INT;
BEGIN
  -- Primary = the customer_id that owns the most sale transactions
  SELECT st.customer_id INTO v_primary_id
  FROM sales_transactions st
  JOIN customers c ON c.id = st.customer_id
  WHERE c.client_name = 'Alley 91'
    AND c.branch      = 'Nanakramguda'
    AND st.transaction_type = 'sale'
  GROUP BY st.customer_id
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  IF v_primary_id IS NULL THEN
    RAISE NOTICE '[fix_alley91] No sales found for Alley 91 / Nanakramguda — nothing to fix.';
    RETURN;
  END IF;

  RAISE NOTICE '[fix_alley91] Primary customer_id = %', v_primary_id;

  -- Secondary = any OTHER customer_id for the same client+branch that has
  -- at least one transaction not already on the primary
  FOR v_secondary_id IN
    SELECT DISTINCT st.customer_id
    FROM sales_transactions st
    JOIN customers c ON c.id = st.customer_id
    WHERE c.client_name = 'Alley 91'
      AND c.branch      = 'Nanakramguda'
      AND st.customer_id <> v_primary_id
  LOOP
    RAISE NOTICE '[fix_alley91] Moving transactions from secondary customer_id = %', v_secondary_id;

    UPDATE sales_transactions
    SET customer_id = v_primary_id
    WHERE customer_id = v_secondary_id;

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE '[fix_alley91] Moved % transaction(s).', v_updated;
  END LOOP;

  -- Recalculate running total_amount for every Alley 91 / Nanakramguda row
  PERFORM recalculate_outstanding_for_client('Alley 91', 'Nanakramguda');
  RAISE NOTICE '[fix_alley91] Recalculated outstanding for Alley 91 / Nanakramguda.';
END;
$$;
