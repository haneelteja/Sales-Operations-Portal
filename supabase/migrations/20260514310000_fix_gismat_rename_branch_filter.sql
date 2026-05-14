-- Corrective pass for Gismat → Jismat rename.
--
-- The previous migration (20260514300000) filtered orders by 'area' column
-- and orders_dispatch fell back to no area filter. This migration re-applies
-- the rename scoped correctly to Ameerpet and Dilshuknagar using the 'branch'
-- column (the canonical UI column), with COALESCE(branch, area) as a safety
-- net. It is fully idempotent — rows already renamed are no-ops.

BEGIN;

-- ── orders: filter by client AND branch ──────────────────────────────────────
UPDATE orders
SET client = 'Jismat'
WHERE client = 'Gismat'
  AND COALESCE(branch, area) IN ('Ameerpet', 'Dilshuknagar');

-- ── orders_dispatch: filter by client AND branch (with area fallback) ─────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders_dispatch') THEN
    -- Use dynamic SQL to safely handle whichever location column(s) exist
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'orders_dispatch' AND column_name = 'branch'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'orders_dispatch' AND column_name = 'area'
    ) THEN
      -- Both columns exist: filter on COALESCE(branch, area)
      EXECUTE $sql$
        UPDATE orders_dispatch SET client = 'Jismat'
        WHERE client = 'Gismat'
          AND COALESCE(branch, area) IN ('Ameerpet', 'Dilshuknagar')
      $sql$;

    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'orders_dispatch' AND column_name = 'branch'
    ) THEN
      -- Only branch column: filter on branch
      EXECUTE $sql$
        UPDATE orders_dispatch SET client = 'Jismat'
        WHERE client = 'Gismat'
          AND branch IN ('Ameerpet', 'Dilshuknagar')
      $sql$;

    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'orders_dispatch' AND column_name = 'area'
    ) THEN
      -- Only area column: filter on area
      EXECUTE $sql$
        UPDATE orders_dispatch SET client = 'Jismat'
        WHERE client = 'Gismat'
          AND area IN ('Ameerpet', 'Dilshuknagar')
      $sql$;

    ELSE
      RAISE NOTICE 'orders_dispatch has neither area nor branch column — skipping location-scoped rename';
    END IF;
  END IF;
END $$;

COMMIT;
