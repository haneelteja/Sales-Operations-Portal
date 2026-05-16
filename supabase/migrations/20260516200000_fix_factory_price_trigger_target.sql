-- Fix: factory_pricing trigger must update factory_payables (production rows only),
-- NOT sales_transactions. The two are completely independent — only SKU and
-- bottles_per_case are shared between them.
--
-- factory_pricing change → factory_payables (production rows)
-- customers price change  → sales_transactions (sale rows)

CREATE OR REPLACE FUNCTION trigger_recalculate_on_factory_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price_per_case IS NOT DISTINCT FROM OLD.price_per_case
     AND NEW.pricing_date IS NOT DISTINCT FROM OLD.pricing_date THEN
    RETURN NEW;
  END IF;

  IF NEW.sku IS NULL OR NEW.price_per_case IS NULL OR NEW.pricing_date IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only production-type rows have amounts derived from factory pricing
  UPDATE factory_payables
  SET amount = quantity * NEW.price_per_case
  WHERE sku = NEW.sku
    AND transaction_type = 'production'
    AND quantity IS NOT NULL
    AND transaction_date::date >= NEW.pricing_date;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-attach trigger so it picks up the corrected function body
DROP TRIGGER IF EXISTS after_factory_price_change ON factory_pricing;
CREATE TRIGGER after_factory_price_change
AFTER UPDATE ON factory_pricing
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_on_factory_price_change();
