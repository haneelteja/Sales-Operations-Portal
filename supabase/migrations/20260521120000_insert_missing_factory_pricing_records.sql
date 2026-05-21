-- STEP 2: Insert 2 missing factory_pricing records.
-- These SKU/date combinations exist in the reference table but are absent from the DB.
-- cost_per_case is a GENERATED column — auto-calculated, do NOT include it in INSERT.

DO $$
DECLARE
  v_bpc_el500  INT;
  v_bpc_p250   INT;
BEGIN

  -- Resolve bottles_per_case from sku_configurations
  SELECT bottles_per_case INTO v_bpc_el500
    FROM public.sku_configurations WHERE sku = 'EL 500 ml';

  SELECT bottles_per_case INTO v_bpc_p250
    FROM public.sku_configurations WHERE sku = 'P 250 ml';

  -- Fallback to known values if sku_configurations is missing entries
  v_bpc_el500 := COALESCE(v_bpc_el500, 20);
  v_bpc_p250  := COALESCE(v_bpc_p250, 30);

  -- ── EL 500 ml | 2026-03-10 ────────────────────────────────────────────────
  -- Expected cost_per_case: 4.904761905 * 1.05 * 20 ≈ 103.0
  IF NOT EXISTS (
    SELECT 1 FROM public.factory_pricing WHERE sku = 'EL 500 ml' AND pricing_date = '2026-03-10'
  ) THEN
    INSERT INTO public.factory_pricing (sku, pricing_date, price_per_bottle, tax, bottles_per_case)
    VALUES ('EL 500 ml', '2026-03-10', 4.904761905, 5, v_bpc_el500);
    RAISE NOTICE 'EL 500 ml | 2026-03-10 | INSERTED | ppb=4.9048 gst=5%% | bpc=%', v_bpc_el500;
  ELSE
    RAISE NOTICE 'EL 500 ml | 2026-03-10 | already exists — skipped';
  END IF;

  -- ── P 250 ml | 2026-03-10 ─────────────────────────────────────────────────
  -- Expected cost_per_case: 3.6 * 1.05 * 30 = 113.4
  IF NOT EXISTS (
    SELECT 1 FROM public.factory_pricing WHERE sku = 'P 250 ml' AND pricing_date = '2026-03-10'
  ) THEN
    INSERT INTO public.factory_pricing (sku, pricing_date, price_per_bottle, tax, bottles_per_case)
    VALUES ('P 250 ml', '2026-03-10', 3.6, 5, v_bpc_p250);
    RAISE NOTICE 'P 250 ml  | 2026-03-10 | INSERTED | ppb=3.6   gst=5%% | bpc=%', v_bpc_p250;
  ELSE
    RAISE NOTICE 'P 250 ml  | 2026-03-10 | already exists — skipped';
  END IF;

  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 2 COMPLETE — verify new rows in app, then run Step 3.';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';

END $$;
