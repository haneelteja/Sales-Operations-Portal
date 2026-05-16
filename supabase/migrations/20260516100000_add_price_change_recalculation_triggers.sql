-- Trigger on customers: when price_per_case or pricing_date changes for a client+SKU,
-- recalculate amount for that client+branch+SKU from pricing_date forward,
-- then cascade outstanding for the full client+branch history.
CREATE OR REPLACE FUNCTION trigger_recalculate_on_customer_price_change()
RETURNS TRIGGER AS $$
DECLARE
  v_client_name TEXT;
  v_branch TEXT;
BEGIN
  IF NEW.price_per_case IS NOT DISTINCT FROM OLD.price_per_case
     AND NEW.pricing_date IS NOT DISTINCT FROM OLD.pricing_date THEN
    RETURN NEW;
  END IF;

  v_client_name := COALESCE(NEW.client_name, NEW.dealer_name);
  v_branch      := COALESCE(NEW.branch, NEW.area);

  IF v_client_name IS NULL OR v_branch IS NULL
     OR NEW.sku IS NULL OR NEW.price_per_case IS NULL OR NEW.pricing_date IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE sales_transactions st
  SET amount = st.quantity * NEW.price_per_case
  FROM customers c
  WHERE st.customer_id = c.id
    AND COALESCE(c.client_name, c.dealer_name) = v_client_name
    AND COALESCE(c.branch, c.area) = v_branch
    AND st.sku = NEW.sku
    AND st.transaction_type = 'sale'
    AND st.quantity IS NOT NULL
    AND st.transaction_date::date >= NEW.pricing_date;

  PERFORM recalculate_outstanding_for_client(v_client_name, v_branch);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_customer_price_change ON customers;
CREATE TRIGGER after_customer_price_change
AFTER UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_on_customer_price_change();


-- Trigger on factory_pricing: when price_per_case or pricing_date changes for a SKU,
-- recalculate amount for ALL clients' sale transactions for that SKU from pricing_date forward,
-- then cascade outstanding for each affected client+branch.
CREATE OR REPLACE FUNCTION trigger_recalculate_on_factory_price_change()
RETURNS TRIGGER AS $$
DECLARE
  r RECORD;
BEGIN
  IF NEW.price_per_case IS NOT DISTINCT FROM OLD.price_per_case
     AND NEW.pricing_date IS NOT DISTINCT FROM OLD.pricing_date THEN
    RETURN NEW;
  END IF;

  IF NEW.sku IS NULL OR NEW.price_per_case IS NULL OR NEW.pricing_date IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE sales_transactions st
  SET amount = st.quantity * NEW.price_per_case
  WHERE st.sku = NEW.sku
    AND st.transaction_type = 'sale'
    AND st.quantity IS NOT NULL
    AND st.transaction_date::date >= NEW.pricing_date;

  FOR r IN
    SELECT DISTINCT
      COALESCE(c.client_name, c.dealer_name) AS client_name,
      COALESCE(c.branch, c.area) AS branch
    FROM sales_transactions st
    JOIN customers c ON c.id = st.customer_id
    WHERE st.sku = NEW.sku
      AND st.transaction_type = 'sale'
      AND st.transaction_date::date >= NEW.pricing_date
      AND COALESCE(c.client_name, c.dealer_name) IS NOT NULL
      AND COALESCE(c.branch, c.area) IS NOT NULL
  LOOP
    PERFORM recalculate_outstanding_for_client(r.client_name, r.branch);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_factory_price_change ON factory_pricing;
CREATE TRIGGER after_factory_price_change
AFTER UPDATE ON factory_pricing
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_on_factory_price_change();
