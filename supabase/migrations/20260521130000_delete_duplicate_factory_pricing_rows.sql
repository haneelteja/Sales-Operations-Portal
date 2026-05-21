-- STEP 3: Remove one duplicate row each for P 250 ml and P 750 ml on 2025-10-01.
-- Both pairs are fully identical — we keep the row with the smaller ctid (earliest physical row)
-- and delete the other one.

DO $$
DECLARE
  v_ctid_p250 TID;
  v_ctid_p750 TID;
  v_count     INT;
BEGIN

  -- ── P 250 ml | 2025-10-01 ─────────────────────────────────────────────────
  SELECT COUNT(*) INTO v_count
    FROM public.factory_pricing WHERE sku = 'P 250 ml' AND pricing_date = '2025-10-01';

  IF v_count > 1 THEN
    -- Pick the ctid of the duplicate to remove (the larger / later physical row)
    SELECT ctid INTO v_ctid_p250
      FROM public.factory_pricing
      WHERE sku = 'P 250 ml' AND pricing_date = '2025-10-01'
      ORDER BY ctid DESC
      LIMIT 1;

    DELETE FROM public.factory_pricing WHERE ctid = v_ctid_p250;
    RAISE NOTICE 'P 250 ml  | 2025-10-01 | deleted duplicate (ctid=%)', v_ctid_p250;
  ELSE
    RAISE NOTICE 'P 250 ml  | 2025-10-01 | % row(s) found — nothing to delete', v_count;
  END IF;

  -- ── P 750 ml | 2025-10-01 ─────────────────────────────────────────────────
  SELECT COUNT(*) INTO v_count
    FROM public.factory_pricing WHERE sku = 'P 750 ml' AND pricing_date = '2025-10-01';

  IF v_count > 1 THEN
    SELECT ctid INTO v_ctid_p750
      FROM public.factory_pricing
      WHERE sku = 'P 750 ml' AND pricing_date = '2025-10-01'
      ORDER BY ctid DESC
      LIMIT 1;

    DELETE FROM public.factory_pricing WHERE ctid = v_ctid_p750;
    RAISE NOTICE 'P 750 ml  | 2025-10-01 | deleted duplicate (ctid=%)', v_ctid_p750;
  ELSE
    RAISE NOTICE 'P 750 ml  | 2025-10-01 | % row(s) found — nothing to delete', v_count;
  END IF;

  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 3 COMPLETE — verify no duplicates remain in app.';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';

END $$;
