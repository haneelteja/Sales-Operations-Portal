-- Fix broken trigger: factory_pricing has no column "price_per_case" — correct name is "cost_per_case".
-- The trigger fired on our Step 1 UPDATE and crashed with "record new has no field price_per_case".

CREATE OR REPLACE FUNCTION trigger_recalculate_on_factory_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- cost_per_case is a generated column; skip if it and pricing_date are unchanged
  IF NEW.cost_per_case IS NOT DISTINCT FROM OLD.cost_per_case
     AND NEW.pricing_date IS NOT DISTINCT FROM OLD.pricing_date THEN
    RETURN NEW;
  END IF;

  IF NEW.sku IS NULL OR NEW.cost_per_case IS NULL OR NEW.pricing_date IS NULL THEN
    RETURN NEW;
  END IF;

  -- Recalculate amounts for all production-type factory_payables rows for this SKU
  UPDATE factory_payables
  SET amount = quantity * NEW.cost_per_case
  WHERE sku = NEW.sku
    AND transaction_type = 'production'
    AND quantity IS NOT NULL
    AND transaction_date::date >= NEW.pricing_date;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-attach trigger
DROP TRIGGER IF EXISTS after_factory_price_change ON factory_pricing;
CREATE TRIGGER after_factory_price_change
AFTER UPDATE ON factory_pricing
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_on_factory_price_change();
