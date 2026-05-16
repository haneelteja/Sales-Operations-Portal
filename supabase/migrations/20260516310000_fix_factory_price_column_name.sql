-- Fix: factory_pricing uses cost_per_case (generated, includes GST),
-- not price_per_case. Correct the trigger and re-run the factory backfill.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Fix the factory_pricing trigger (cost_per_case, not price_per_case)
--    Fires when price_per_bottle, tax, or pricing_date changes — those are
--    the inputs that drive cost_per_case.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_recalculate_on_factory_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price_per_bottle IS NOT DISTINCT FROM OLD.price_per_bottle
     AND NEW.tax           IS NOT DISTINCT FROM OLD.tax
     AND NEW.pricing_date  IS NOT DISTINCT FROM OLD.pricing_date THEN
    RETURN NEW;
  END IF;

  IF NEW.sku IS NULL OR NEW.cost_per_case IS NULL OR NEW.pricing_date IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE factory_payables
  SET amount = quantity * NEW.cost_per_case
  WHERE sku              = NEW.sku
    AND transaction_type = 'production'
    AND quantity         IS NOT NULL
    AND transaction_date::date >= NEW.pricing_date;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_factory_price_change ON factory_pricing;
CREATE TRIGGER after_factory_price_change
AFTER UPDATE ON factory_pricing
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_on_factory_price_change();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Re-run the factory_payables backfill using cost_per_case
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE factory_payables fp
SET amount = fp.quantity * (
  SELECT fp2.cost_per_case
  FROM factory_pricing fp2
  WHERE fp2.sku           = fp.sku
    AND fp2.cost_per_case IS NOT NULL
    AND fp2.pricing_date <= fp.transaction_date::date
  ORDER BY fp2.pricing_date DESC
  LIMIT 1
)
WHERE fp.transaction_type = 'production'
  AND fp.quantity          IS NOT NULL
  AND fp.sku               IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM factory_pricing fp2
    WHERE fp2.sku           = fp.sku
      AND fp2.cost_per_case IS NOT NULL
      AND fp2.pricing_date <= fp.transaction_date::date
  );
