-- Deduplicate all customers where same (client_name, branch) has multiple records.
-- For each duplicate group the "keeper" is whichever customer_id has the most
-- sales_transactions rows; ties broken by earliest created_at.
-- All referencing rows are re-assigned to the keeper, then duplicates are deleted.

DO $$
DECLARE
  r           RECORD;   -- duplicate group
  dup         RECORD;   -- non-keeper in that group
  v_keeper_id UUID;
  v_n         INT;
  v_groups    INT := 0;
  v_deleted   INT := 0;
BEGIN

  FOR r IN
    SELECT client_name, branch, COUNT(*) AS cnt
    FROM   public.customers
    WHERE  client_name IS NOT NULL
      AND  branch      IS NOT NULL
    GROUP  BY client_name, branch
    HAVING COUNT(*) > 1
    ORDER  BY client_name, branch
  LOOP
    v_groups := v_groups + 1;
    RAISE NOTICE '--- Group: "%" / "%" (%  records) ---', r.client_name, r.branch, r.cnt;

    -- keeper = highest transaction count; ties → earliest created_at
    SELECT c.id INTO v_keeper_id
    FROM   public.customers c
    LEFT JOIN (
      SELECT customer_id, COUNT(*) AS tx_count
      FROM   public.sales_transactions
      GROUP  BY customer_id
    ) tx ON tx.customer_id = c.id
    WHERE  c.client_name = r.client_name
      AND  c.branch      = r.branch
    ORDER  BY COALESCE(tx.tx_count, 0) DESC, c.created_at ASC
    LIMIT  1;

    RAISE NOTICE '  Keeper: %', v_keeper_id;

    FOR dup IN
      SELECT id
      FROM   public.customers
      WHERE  client_name = r.client_name
        AND  branch      = r.branch
        AND  id <> v_keeper_id
    LOOP
      RAISE NOTICE '  Merging dup: %', dup.id;

      UPDATE public.sales_transactions   SET customer_id = v_keeper_id WHERE customer_id = dup.id;
      GET DIAGNOSTICS v_n = ROW_COUNT;  RAISE NOTICE '    sales_transactions   : %', v_n;

      UPDATE public.invoices             SET customer_id = v_keeper_id WHERE customer_id = dup.id;
      GET DIAGNOSTICS v_n = ROW_COUNT;  RAISE NOTICE '    invoices             : %', v_n;

      UPDATE public.orders               SET customer_id = v_keeper_id WHERE customer_id = dup.id;
      GET DIAGNOSTICS v_n = ROW_COUNT;  RAISE NOTICE '    orders               : %', v_n;

      UPDATE public.factory_payables     SET customer_id = v_keeper_id WHERE customer_id = dup.id;
      GET DIAGNOSTICS v_n = ROW_COUNT;  RAISE NOTICE '    factory_payables     : %', v_n;

      UPDATE public.client_followup_notes SET customer_id = v_keeper_id WHERE customer_id = dup.id;
      GET DIAGNOSTICS v_n = ROW_COUNT;  RAISE NOTICE '    client_followup_notes: %', v_n;

      UPDATE public.transport_expenses   SET client_id   = v_keeper_id WHERE client_id   = dup.id;
      GET DIAGNOSTICS v_n = ROW_COUNT;  RAISE NOTICE '    transport_expenses   : %', v_n;

      DELETE FROM public.customers WHERE id = dup.id;
      v_deleted := v_deleted + 1;
      RAISE NOTICE '    Deleted dup %', dup.id;
    END LOOP;
  END LOOP;

  RAISE NOTICE '=== Done. Groups processed: %  |  Duplicates deleted: % ===', v_groups, v_deleted;
END $$;
