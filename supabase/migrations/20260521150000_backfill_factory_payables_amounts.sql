-- STEP 4 FIX: Re-backfill all production factory_payables amounts where
-- stored amount doesn't match quantity * correct cost_per_case.
--
-- For each production row, find the applicable pricing record (latest
-- pricing_date <= transaction_date for that SKU) and set amount accordingly.
-- Rows already correct (diff < 0.01) are untouched.
--
-- Known reasons for mismatches:
--   1. EL 500 ml rows on/after 2026-03-10 — new pricing was INSERTed in
--      Step 2 but INSERT does not fire the AFTER UPDATE trigger.
--   2. Any rows with pre-existing manual entry errors.

DO $$
DECLARE
  v_updated INT;
BEGIN

  WITH corrections AS (
    SELECT fp.id, ROUND((fp.quantity * pr.cost_per_case)::numeric, 2) AS correct_amount
    FROM public.factory_payables fp
    JOIN LATERAL (
      SELECT cost_per_case
      FROM public.factory_pricing
      WHERE sku = fp.sku
        AND pricing_date <= fp.transaction_date::date
      ORDER BY pricing_date DESC
      LIMIT 1
    ) pr ON true
    WHERE fp.transaction_type = 'production'
      AND fp.quantity IS NOT NULL
      AND ABS(fp.amount - fp.quantity * pr.cost_per_case) >= 0.01
  )
  UPDATE public.factory_payables fp
  SET amount = c.correct_amount
  FROM corrections c
  WHERE fp.id = c.id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RAISE NOTICE '══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 4 COMPLETE — % production payable row(s) corrected.', v_updated;
  RAISE NOTICE '══════════════════════════════════════════════════════════════';

END $$;
