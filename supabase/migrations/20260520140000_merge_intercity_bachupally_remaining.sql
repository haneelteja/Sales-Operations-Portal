-- Second pass: merge any remaining Intercity Bachupally duplicate into keeper.
-- The first migration deleted a ghost record (a77fc179). A third record still
-- holds all the sale transactions and invoices. This migration merges it into
-- the known keeper (1ee3ce8c-a487-4035-8103-abf40a3fbd12).

DO $$
DECLARE
  v_keeper_id   UUID := '1ee3ce8c-a487-4035-8103-abf40a3fbd12';
  v_dup_id      UUID;
  v_tx_updated  INT;
  v_inv_updated INT;
  v_ord_updated INT;
  v_fp_updated  INT;
  v_fn_updated  INT;
  v_te_updated  INT;
BEGIN

  -- ── 1. Verify keeper exists ──────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = v_keeper_id) THEN
    RAISE EXCEPTION 'Keeper % not found in customers table. Aborting.', v_keeper_id;
  END IF;

  -- ── 2. Find any remaining duplicate (same name+branch, different id) ─────────
  SELECT c.id INTO v_dup_id
  FROM   public.customers c
  WHERE  c.client_name ILIKE 'Intercity'
    AND  c.branch      ILIKE 'Bachupally'
    AND  c.id <> v_keeper_id
  LIMIT 1;

  IF v_dup_id IS NULL THEN
    RAISE NOTICE 'No duplicate Intercity Bachupally customer found. Nothing to do.';
    RETURN;
  END IF;

  RAISE NOTICE 'Keeper  customer_id : %', v_keeper_id;
  RAISE NOTICE 'Dup     customer_id : %', v_dup_id;

  -- ── 3. Re-assign sales_transactions ─────────────────────────────────────────
  UPDATE public.sales_transactions
  SET    customer_id = v_keeper_id
  WHERE  customer_id = v_dup_id;
  GET DIAGNOSTICS v_tx_updated = ROW_COUNT;
  RAISE NOTICE 'sales_transactions updated: %', v_tx_updated;

  -- ── 4. Re-assign invoices ────────────────────────────────────────────────────
  UPDATE public.invoices
  SET    customer_id = v_keeper_id
  WHERE  customer_id = v_dup_id;
  GET DIAGNOSTICS v_inv_updated = ROW_COUNT;
  RAISE NOTICE 'invoices updated: %', v_inv_updated;

  -- ── 5. Re-assign orders ──────────────────────────────────────────────────────
  UPDATE public.orders
  SET    customer_id = v_keeper_id
  WHERE  customer_id = v_dup_id;
  GET DIAGNOSTICS v_ord_updated = ROW_COUNT;
  RAISE NOTICE 'orders updated: %', v_ord_updated;

  -- ── 6. Re-assign factory_payables ───────────────────────────────────────────
  UPDATE public.factory_payables
  SET    customer_id = v_keeper_id
  WHERE  customer_id = v_dup_id;
  GET DIAGNOSTICS v_fp_updated = ROW_COUNT;
  RAISE NOTICE 'factory_payables updated: %', v_fp_updated;

  -- ── 7. Re-assign client_followup_notes ──────────────────────────────────────
  UPDATE public.client_followup_notes
  SET    customer_id = v_keeper_id
  WHERE  customer_id = v_dup_id;
  GET DIAGNOSTICS v_fn_updated = ROW_COUNT;
  RAISE NOTICE 'client_followup_notes updated: %', v_fn_updated;

  -- ── 8. Re-assign transport_expenses (uses client_id column) ─────────────────
  UPDATE public.transport_expenses
  SET    client_id = v_keeper_id
  WHERE  client_id = v_dup_id;
  GET DIAGNOSTICS v_te_updated = ROW_COUNT;
  RAISE NOTICE 'transport_expenses updated: %', v_te_updated;

  -- ── 9. Delete the duplicate customer row ────────────────────────────────────
  DELETE FROM public.customers WHERE id = v_dup_id;
  RAISE NOTICE 'Duplicate customer deleted: %', v_dup_id;

  RAISE NOTICE 'Done. All records consolidated under keeper %', v_keeper_id;

END $$;
