-- STEP 1: Set correct price_per_bottle and tax for all existing factory_pricing records.
-- cost_per_case is a GENERATED column — auto-recalculated by DB when price_per_bottle/tax change.
-- Source of truth: image 2 (correct factory pricing table).

DO $$
DECLARE
  v_n INT;
BEGIN

  -- ── 1000 EC ────────────────────────────────────────────────────────────────
  UPDATE public.factory_pricing SET price_per_bottle = 7.5, tax = 18
    WHERE sku = '1000 EC' AND pricing_date = '2025-03-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE '1000 EC  | 2025-03-01 | ppb=7.5   gst=18%% | rows=%', v_n;

  UPDATE public.factory_pricing SET price_per_bottle = 7.5, tax = 5
    WHERE sku = '1000 EC' AND pricing_date = '2025-10-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE '1000 EC  | 2025-10-01 | ppb=7.5   gst=5%%  | rows=%', v_n;

  -- ── 250 EC ─────────────────────────────────────────────────────────────────
  UPDATE public.factory_pricing SET price_per_bottle = 3.6, tax = 18
    WHERE sku = '250 EC' AND pricing_date = '2025-03-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE '250 EC   | 2025-03-01 | ppb=3.6   gst=18%% | rows=%', v_n;

  UPDATE public.factory_pricing SET price_per_bottle = 2.93877551, tax = 5
    WHERE sku = '250 EC' AND pricing_date = '2025-10-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE '250 EC   | 2025-10-01 | ppb=2.9388 gst=5%%  | rows=%', v_n;

  -- ── AL 500 ml ──────────────────────────────────────────────────────────────
  UPDATE public.factory_pricing SET price_per_bottle = 8.665254237, tax = 18
    WHERE sku = 'AL 500 ml' AND pricing_date = '2025-03-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'AL 500   | 2025-03-01 | ppb=8.6653 gst=18%% | rows=%', v_n;

  UPDATE public.factory_pricing SET price_per_bottle = 5.2, tax = 5
    WHERE sku = 'AL 500 ml' AND pricing_date = '2025-10-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'AL 500   | 2025-10-01 | ppb=5.2   gst=5%%  | rows=%', v_n;

  -- ── AL 750 ml ──────────────────────────────────────────────────────────────
  UPDATE public.factory_pricing SET price_per_bottle = 7, tax = 18
    WHERE sku = 'AL 750 ml' AND pricing_date = '2025-03-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'AL 750   | 2025-03-01 | ppb=7     gst=18%% | rows=%', v_n;

  UPDATE public.factory_pricing SET price_per_bottle = 7, tax = 5
    WHERE sku = 'AL 750 ml' AND pricing_date = '2025-10-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'AL 750   | 2025-10-01 | ppb=7     gst=5%%  | rows=%', v_n;

  -- ── EL 250 ml ──────────────────────────────────────────────────────────────
  UPDATE public.factory_pricing SET price_per_bottle = 3.6, tax = 18
    WHERE sku = 'EL 250 ml' AND pricing_date = '2025-01-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'EL 250   | 2025-01-01 | ppb=3.6   gst=18%% | rows=%', v_n;

  UPDATE public.factory_pricing SET price_per_bottle = 2.93877551, tax = 5
    WHERE sku = 'EL 250 ml' AND pricing_date = '2025-10-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'EL 250   | 2025-10-01 | ppb=2.9388 gst=5%%  | rows=%', v_n;

  -- ── EL 500 ml ──────────────────────────────────────────────────────────────
  UPDATE public.factory_pricing SET price_per_bottle = 4.8, tax = 18
    WHERE sku = 'EL 500 ml' AND pricing_date = '2025-03-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'EL 500   | 2025-03-01 | ppb=4.8   gst=18%% | rows=%', v_n;

  UPDATE public.factory_pricing SET price_per_bottle = 4.19047619, tax = 5
    WHERE sku = 'EL 500 ml' AND pricing_date = '2025-10-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'EL 500   | 2025-10-01 | ppb=4.1905 gst=5%%  | rows=%', v_n;

  -- ── P 1000 ml ──────────────────────────────────────────────────────────────
  UPDATE public.factory_pricing SET price_per_bottle = 8.05, tax = 18
    WHERE sku = 'P 1000 ml' AND pricing_date = '2025-01-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 1000   | 2025-01-01 | ppb=8.05  gst=18%% | rows=%', v_n;

  UPDATE public.factory_pricing SET price_per_bottle = 8.05, tax = 5
    WHERE sku = 'P 1000 ml' AND pricing_date = '2025-10-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 1000   | 2025-10-01 | ppb=8.05  gst=5%%  | rows=%', v_n;

  UPDATE public.factory_pricing SET price_per_bottle = 9.555555556, tax = 5
    WHERE sku = 'P 1000 ml' AND pricing_date = '2026-03-10';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 1000   | 2026-03-10 | ppb=9.5556 gst=5%%  | rows=%', v_n;

  UPDATE public.factory_pricing SET price_per_bottle = 9.357142857, tax = 5
    WHERE sku = 'P 1000 ml' AND pricing_date = '2026-05-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 1000   | 2026-05-01 | ppb=9.3571 gst=5%%  | rows=%', v_n;

  -- ── P 250 ml ───────────────────────────────────────────────────────────────
  UPDATE public.factory_pricing SET price_per_bottle = 3.6, tax = 18
    WHERE sku = 'P 250 ml' AND pricing_date = '2025-01-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 250    | 2025-01-01 | ppb=3.6   gst=18%% | rows=%', v_n;

  UPDATE public.factory_pricing SET price_per_bottle = 3.6, tax = 5
    WHERE sku = 'P 250 ml' AND pricing_date = '2025-10-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  -- Note: two duplicate rows exist for this date; both updated — deduplicated in Step 3
  RAISE NOTICE 'P 250    | 2025-10-01 | ppb=3.6   gst=5%%  | rows=% (incl. duplicate)', v_n;

  -- ── P 500 ml ───────────────────────────────────────────────────────────────
  UPDATE public.factory_pricing SET price_per_bottle = 5.2, tax = 18
    WHERE sku = 'P 500 ml' AND pricing_date = '2025-01-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 500    | 2025-01-01 | ppb=5.2   gst=18%% | rows=%', v_n;

  UPDATE public.factory_pricing SET price_per_bottle = 5.2, tax = 5
    WHERE sku = 'P 500 ml' AND pricing_date = '2025-10-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 500    | 2025-10-01 | ppb=5.2   gst=5%%  | rows=%', v_n;

  UPDATE public.factory_pricing SET price_per_bottle = 6.057142857, tax = 5
    WHERE sku = 'P 500 ml' AND pricing_date = '2026-03-10';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 500    | 2026-03-10 | ppb=6.0571 gst=5%%  | rows=%', v_n;

  UPDATE public.factory_pricing SET price_per_bottle = 5.938095238, tax = 5
    WHERE sku = 'P 500 ml' AND pricing_date = '2026-05-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 500    | 2026-05-01 | ppb=5.9381 gst=5%%  | rows=%', v_n;

  -- ── P 750 ml ───────────────────────────────────────────────────────────────
  UPDATE public.factory_pricing SET price_per_bottle = 7, tax = 18
    WHERE sku = 'P 750 ml' AND pricing_date = '2025-01-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 750    | 2025-01-01 | ppb=7     gst=18%% | rows=%', v_n;

  UPDATE public.factory_pricing SET price_per_bottle = 7, tax = 5
    WHERE sku = 'P 750 ml' AND pricing_date = '2025-03-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 750    | 2025-03-01 | ppb=7     gst=5%%  | rows=%', v_n;

  UPDATE public.factory_pricing SET price_per_bottle = 7, tax = 5
    WHERE sku = 'P 750 ml' AND pricing_date = '2025-10-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  -- Note: two duplicate rows exist for this date; both updated — deduplicated in Step 3
  RAISE NOTICE 'P 750    | 2025-10-01 | ppb=7     gst=5%%  | rows=% (incl. duplicate)', v_n;

  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 1 COMPLETE — verify in app before running Steps 2 and 3.';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';

END $$;
