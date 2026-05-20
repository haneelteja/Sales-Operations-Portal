-- Final merge: consolidate the two real Intercity Bachupally records.
-- 3586f6d7 holds 68 sale transactions; 1ee3ce8c holds 11 payment transactions.
-- Re-assign all records from 3586f6d7 into 1ee3ce8c, then delete 3586f6d7.

DO $$
DECLARE
  v_keeper_id UUID := '1ee3ce8c-a487-4035-8103-abf40a3fbd12';
  v_dup_id    UUID := '3586f6d7-e024-4b5b-b506-69445fc22f3d';
  v_n         INT;
BEGIN

  -- Verify both exist
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = v_keeper_id) THEN
    RAISE EXCEPTION 'Keeper % not found. Aborting.', v_keeper_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = v_dup_id) THEN
    RAISE EXCEPTION 'Duplicate % not found. Aborting.', v_dup_id;
  END IF;

  RAISE NOTICE 'Keeper  : %', v_keeper_id;
  RAISE NOTICE 'Merging : %', v_dup_id;

  UPDATE public.sales_transactions SET customer_id = v_keeper_id WHERE customer_id = v_dup_id;
  GET DIAGNOSTICS v_n = ROW_COUNT; RAISE NOTICE 'sales_transactions  : %', v_n;

  UPDATE public.invoices SET customer_id = v_keeper_id WHERE customer_id = v_dup_id;
  GET DIAGNOSTICS v_n = ROW_COUNT; RAISE NOTICE 'invoices            : %', v_n;

  UPDATE public.orders SET customer_id = v_keeper_id WHERE customer_id = v_dup_id;
  GET DIAGNOSTICS v_n = ROW_COUNT; RAISE NOTICE 'orders              : %', v_n;

  UPDATE public.factory_payables SET customer_id = v_keeper_id WHERE customer_id = v_dup_id;
  GET DIAGNOSTICS v_n = ROW_COUNT; RAISE NOTICE 'factory_payables    : %', v_n;

  UPDATE public.client_followup_notes SET customer_id = v_keeper_id WHERE customer_id = v_dup_id;
  GET DIAGNOSTICS v_n = ROW_COUNT; RAISE NOTICE 'client_followup_notes: %', v_n;

  UPDATE public.transport_expenses SET client_id = v_keeper_id WHERE client_id = v_dup_id;
  GET DIAGNOSTICS v_n = ROW_COUNT; RAISE NOTICE 'transport_expenses  : %', v_n;

  DELETE FROM public.customers WHERE id = v_dup_id;
  RAISE NOTICE 'Deleted duplicate %', v_dup_id;
  RAISE NOTICE 'Done — all records now under keeper %', v_keeper_id;

END $$;
