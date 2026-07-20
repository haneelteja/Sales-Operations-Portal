-- Fix: Illuzion / Jubliee Hills — split customer_id
--
-- Two customer rows exist for the same client+branch+sku:
--   fb97d055 (primary) — holds all sales
--   4b67eb47 (secondary) — 7/19 payment was recorded here by mistake
--
-- The Receivables RPC groups by customer_id so it shows ₹36,750
-- on fb97d055 without seeing the payment on 4b67eb47.
-- Redirect the payment to the primary UUID and recalculate.

DO $$
DECLARE
  v_primary   UUID := 'fb97d055-47fa-48ad-9fbf-817bfce59006';
  v_secondary UUID := '4b67eb47-99e4-4821-8ea3-b956f17adcdd';
  v_moved     INT;
BEGIN
  -- Verify both records are still present
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = v_primary) THEN
    RAISE EXCEPTION '[illuzion_fix] Primary customer % not found', v_primary;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = v_secondary) THEN
    RAISE NOTICE '[illuzion_fix] Secondary customer % not found — already cleaned up', v_secondary;
    RETURN;
  END IF;

  -- Move all transactions from secondary to primary
  UPDATE public.sales_transactions
  SET customer_id = v_primary
  WHERE customer_id = v_secondary;
  GET DIAGNOSTICS v_moved = ROW_COUNT;
  RAISE NOTICE '[illuzion_fix] Moved % transaction(s) from % to %', v_moved, v_secondary, v_primary;

  -- Recalculate running balance for the unified customer
  PERFORM recalculate_outstanding_for_client('Illuzion', 'Jubliee Hills');
  RAISE NOTICE '[illuzion_fix] Recalculated outstanding for Illuzion / Jubliee Hills';
END $$;
