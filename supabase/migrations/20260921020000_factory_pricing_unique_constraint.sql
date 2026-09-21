-- Add UNIQUE constraint on factory_pricing(sku, pricing_date).
--
-- Duplicate (sku, pricing_date) rows were found in production and manually removed via
-- migrations. Without this constraint, the generated cost_per_case column and the
-- trigger_recalculate_on_factory_price_change() function behave non-deterministically
-- if duplicates re-appear.
--
-- Step 1: Remove any remaining duplicates (keep the row with the latest created_at).
-- Step 2: Add the UNIQUE constraint.

-- Remove duplicates: for each (sku, pricing_date) group, keep the most-recently-created row.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.factory_pricing
    GROUP BY sku, pricing_date
    HAVING COUNT(*) > 1
  ) THEN
    DELETE FROM public.factory_pricing fp
    WHERE fp.id NOT IN (
      SELECT DISTINCT ON (sku, pricing_date) id
      FROM public.factory_pricing
      ORDER BY sku, pricing_date, created_at DESC NULLS LAST
    );
  END IF;
END;
$$;

-- Add the constraint only if it doesn't already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.factory_pricing'::regclass
      AND conname = 'factory_pricing_sku_date_key'
  ) THEN
    ALTER TABLE public.factory_pricing
      ADD CONSTRAINT factory_pricing_sku_date_key UNIQUE (sku, pricing_date);
  END IF;
END;
$$;

-- Supporting index for trigger_recalculate_on_factory_price_change() which looks up
-- by (sku, pricing_date) on every factory price update.
CREATE INDEX IF NOT EXISTS idx_factory_pricing_sku_date
  ON public.factory_pricing (sku, pricing_date);
