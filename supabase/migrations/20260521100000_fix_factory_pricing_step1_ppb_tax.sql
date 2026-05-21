-- STEP 1: Set correct price_per_bottle and tax for all existing factory_pricing records.
-- cost_per_case is recalculated from formula: price_per_bottle * (1 + tax/100) * bottles_per_case
-- Source of truth: image 2 (correct factory pricing table).

DO $$
DECLARE
  v_n INT;
BEGIN

  -- ── 1000 EC ────────────────────────────────────────────────────────────────
  UPDATE public.factory_pricing
    SET price_per_bottle = 7.5, tax = 18,
        cost_per_case = ROUND((7.5 * 1.18 * 12)::numeric, 4)
    WHERE sku = '1000 EC' AND pricing_date = '2025-03-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE '1000 EC  | 2025-03-01 | ppb=7.5  gst=18%% | rows=%', v_n;

  UPDATE public.factory_pricing
    SET price_per_bottle = 7.5, tax = 5,
        cost_per_case = ROUND((7.5 * 1.05 * 12)::numeric, 4)
    WHERE sku = '1000 EC' AND pricing_date = '2025-10-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE '1000 EC  | 2025-10-01 | ppb=7.5  gst=5%%  | rows=%', v_n;

  -- ── 250 EC ─────────────────────────────────────────────────────────────────
  UPDATE public.factory_pricing
    SET price_per_bottle = 3.6, tax = 18,
        cost_per_case = ROUND((3.6 * 1.18 * 35)::numeric, 4)
    WHERE sku = '250 EC' AND pricing_date = '2025-03-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE '250 EC   | 2025-03-01 | ppb=3.6  gst=18%% | rows=%', v_n;

  UPDATE public.factory_pricing
    SET price_per_bottle = 2.93877551, tax = 5,
        cost_per_case = ROUND((2.93877551 * 1.05 * 35)::numeric, 4)
    WHERE sku = '250 EC' AND pricing_date = '2025-10-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE '250 EC   | 2025-10-01 | ppb=2.9388 gst=5%% | rows=%', v_n;

  -- ── AL 500 ml ──────────────────────────────────────────────────────────────
  UPDATE public.factory_pricing
    SET price_per_bottle = 8.665254237, tax = 18,
        cost_per_case = ROUND((8.665254237 * 1.18 * 12)::numeric, 4)
    WHERE sku = 'AL 500 ml' AND pricing_date = '2025-03-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'AL 500   | 2025-03-01 | ppb=8.6653 gst=18%% | rows=%', v_n;

  UPDATE public.factory_pricing
    SET price_per_bottle = 5.2, tax = 5,
        cost_per_case = ROUND((5.2 * 1.05 * 12)::numeric, 4)
    WHERE sku = 'AL 500 ml' AND pricing_date = '2025-10-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'AL 500   | 2025-10-01 | ppb=5.2  gst=5%%  | rows=%', v_n;

  -- ── AL 750 ml ──────────────────────────────────────────────────────────────
  UPDATE public.factory_pricing
    SET price_per_bottle = 7, tax = 18,
        cost_per_case = ROUND((7 * 1.18 * 12)::numeric, 4)
    WHERE sku = 'AL 750 ml' AND pricing_date = '2025-03-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'AL 750   | 2025-03-01 | ppb=7    gst=18%% | rows=%', v_n;

  UPDATE public.factory_pricing
    SET price_per_bottle = 7, tax = 5,
        cost_per_case = ROUND((7 * 1.05 * 12)::numeric, 4)
    WHERE sku = 'AL 750 ml' AND pricing_date = '2025-10-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'AL 750   | 2025-10-01 | ppb=7    gst=5%%  | rows=%', v_n;

  -- ── EL 250 ml ──────────────────────────────────────────────────────────────
  UPDATE public.factory_pricing
    SET price_per_bottle = 3.6, tax = 18,
        cost_per_case = ROUND((3.6 * 1.18 * 35)::numeric, 4)
    WHERE sku = 'EL 250 ml' AND pricing_date = '2025-01-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'EL 250   | 2025-01-01 | ppb=3.6  gst=18%% | rows=%', v_n;

  UPDATE public.factory_pricing
    SET price_per_bottle = 2.93877551, tax = 5,
        cost_per_case = ROUND((2.93877551 * 1.05 * 35)::numeric, 4)
    WHERE sku = 'EL 250 ml' AND pricing_date = '2025-10-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'EL 250   | 2025-10-01 | ppb=2.9388 gst=5%% | rows=%', v_n;

  -- ── EL 500 ml ──────────────────────────────────────────────────────────────
  UPDATE public.factory_pricing
    SET price_per_bottle = 4.8, tax = 18,
        cost_per_case = ROUND((4.8 * 1.18 * 20)::numeric, 4)
    WHERE sku = 'EL 500 ml' AND pricing_date = '2025-03-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'EL 500   | 2025-03-01 | ppb=4.8  gst=18%% | rows=%', v_n;

  UPDATE public.factory_pricing
    SET price_per_bottle = 4.19047619, tax = 5,
        cost_per_case = ROUND((4.19047619 * 1.05 * 20)::numeric, 4)
    WHERE sku = 'EL 500 ml' AND pricing_date = '2025-10-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'EL 500   | 2025-10-01 | ppb=4.1905 gst=5%% | rows=%', v_n;

  -- ── P 1000 ml ──────────────────────────────────────────────────────────────
  UPDATE public.factory_pricing
    SET price_per_bottle = 8.05, tax = 18,
        cost_per_case = ROUND((8.05 * 1.18 * 12)::numeric, 4)
    WHERE sku = 'P 1000 ml' AND pricing_date = '2025-01-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 1000   | 2025-01-01 | ppb=8.05 gst=18%% | rows=%', v_n;

  UPDATE public.factory_pricing
    SET price_per_bottle = 8.05, tax = 5,
        cost_per_case = ROUND((8.05 * 1.05 * 12)::numeric, 4)
    WHERE sku = 'P 1000 ml' AND pricing_date = '2025-10-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 1000   | 2025-10-01 | ppb=8.05 gst=5%%  | rows=%', v_n;

  UPDATE public.factory_pricing
    SET price_per_bottle = 9.555555556, tax = 5,
        cost_per_case = ROUND((9.555555556 * 1.05 * 12)::numeric, 4)
    WHERE sku = 'P 1000 ml' AND pricing_date = '2026-03-10';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 1000   | 2026-03-10 | ppb=9.5556 gst=5%% | rows=%', v_n;

  UPDATE public.factory_pricing
    SET price_per_bottle = 9.357142857, tax = 5,
        cost_per_case = ROUND((9.357142857 * 1.05 * 12)::numeric, 4)
    WHERE sku = 'P 1000 ml' AND pricing_date = '2026-05-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 1000   | 2026-05-01 | ppb=9.3571 gst=5%% | rows=%', v_n;

  -- ── P 250 ml ───────────────────────────────────────────────────────────────
  UPDATE public.factory_pricing
    SET price_per_bottle = 3.6, tax = 18,
        cost_per_case = ROUND((3.6 * 1.18 * 30)::numeric, 4)
    WHERE sku = 'P 250 ml' AND pricing_date = '2025-01-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 250    | 2025-01-01 | ppb=3.6  gst=18%% | rows=%', v_n;

  UPDATE public.factory_pricing
    SET price_per_bottle = 3.6, tax = 5,
        cost_per_case = ROUND((3.6 * 1.05 * 30)::numeric, 4)
    WHERE sku = 'P 250 ml' AND pricing_date = '2025-10-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  -- Note: two duplicate rows exist for this date; both get same values (deduplicated in Step 3)
  RAISE NOTICE 'P 250    | 2025-10-01 | ppb=3.6  gst=5%%  | rows=% (includes duplicate)', v_n;

  -- ── P 500 ml ───────────────────────────────────────────────────────────────
  UPDATE public.factory_pricing
    SET price_per_bottle = 5.2, tax = 18,
        cost_per_case = ROUND((5.2 * 1.18 * 20)::numeric, 4)
    WHERE sku = 'P 500 ml' AND pricing_date = '2025-01-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 500    | 2025-01-01 | ppb=5.2  gst=18%% | rows=%', v_n;

  UPDATE public.factory_pricing
    SET price_per_bottle = 5.2, tax = 5,
        cost_per_case = ROUND((5.2 * 1.05 * 20)::numeric, 4)
    WHERE sku = 'P 500 ml' AND pricing_date = '2025-10-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 500    | 2025-10-01 | ppb=5.2  gst=5%%  | rows=%', v_n;

  UPDATE public.factory_pricing
    SET price_per_bottle = 6.057142857, tax = 5,
        cost_per_case = ROUND((6.057142857 * 1.05 * 20)::numeric, 4)
    WHERE sku = 'P 500 ml' AND pricing_date = '2026-03-10';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 500    | 2026-03-10 | ppb=6.0571 gst=5%% | rows=%', v_n;

  UPDATE public.factory_pricing
    SET price_per_bottle = 5.938095238, tax = 5,
        cost_per_case = ROUND((5.938095238 * 1.05 * 20)::numeric, 4)
    WHERE sku = 'P 500 ml' AND pricing_date = '2026-05-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 500    | 2026-05-01 | ppb=5.9381 gst=5%% | rows=%', v_n;

  -- ── P 750 ml ───────────────────────────────────────────────────────────────
  UPDATE public.factory_pricing
    SET price_per_bottle = 7, tax = 18,
        cost_per_case = ROUND((7 * 1.18 * 12)::numeric, 4)
    WHERE sku = 'P 750 ml' AND pricing_date = '2025-01-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 750    | 2025-01-01 | ppb=7    gst=18%% | rows=%', v_n;

  UPDATE public.factory_pricing
    SET price_per_bottle = 7, tax = 5,
        cost_per_case = ROUND((7 * 1.05 * 12)::numeric, 4)
    WHERE sku = 'P 750 ml' AND pricing_date = '2025-03-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'P 750    | 2025-03-01 | ppb=7    gst=5%%  | rows=%', v_n;

  UPDATE public.factory_pricing
    SET price_per_bottle = 7, tax = 5,
        cost_per_case = ROUND((7 * 1.05 * 12)::numeric, 4)
    WHERE sku = 'P 750 ml' AND pricing_date = '2025-10-01';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  -- Note: two duplicate rows exist for this date; both updated (deduplicated in Step 3)
  RAISE NOTICE 'P 750    | 2025-10-01 | ppb=7    gst=5%%  | rows=% (includes duplicate)', v_n;

  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 1 COMPLETE — verify in app before running Step 2 (inserts) and Step 3 (dedup).';
  RAISE NOTICE '══════════════════════════════════════════════════════════════';

END $$;
