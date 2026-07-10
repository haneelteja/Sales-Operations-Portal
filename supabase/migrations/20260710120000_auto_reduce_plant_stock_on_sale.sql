-- Auto-reduce plant stock when a sale transaction is inserted.
-- On each INSERT of a 'sale' row in sales_transactions that has a sku + quantity,
-- we look up the most recent plant_stock entry for that (customer_id, sku) pair
-- and insert a new plant_stock row with the reduced quantity (floored at 0).

CREATE OR REPLACE FUNCTION auto_reduce_plant_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_qty INTEGER;
  v_new_qty     INTEGER;
BEGIN
  -- Only act on sales with a SKU and positive quantity
  IF NEW.transaction_type = 'sale'
     AND NEW.sku IS NOT NULL
     AND NEW.quantity IS NOT NULL
     AND NEW.quantity > 0
     AND NEW.customer_id IS NOT NULL
  THEN
    -- Latest plant_stock snapshot for this client + SKU
    SELECT quantity INTO v_current_qty
    FROM factory_payables
    WHERE customer_id      = NEW.customer_id
      AND sku              = NEW.sku
      AND transaction_type = 'plant_stock'
    ORDER BY created_at DESC
    LIMIT 1;

    -- Only write a new snapshot if one exists to reduce
    IF v_current_qty IS NOT NULL THEN
      v_new_qty := GREATEST(0, v_current_qty - NEW.quantity);

      INSERT INTO factory_payables (
        customer_id,
        sku,
        quantity,
        transaction_date,
        transaction_type,
        amount,
        description
      ) VALUES (
        NEW.customer_id,
        NEW.sku,
        v_new_qty,
        NEW.transaction_date,
        'plant_stock',
        0,
        'Auto-reduced: ' || NEW.quantity || ' cases sold' ||
          CASE
            WHEN NEW.invoice_number IS NOT NULL
            THEN ' (' || NEW.invoice_number || ')'
            ELSE ''
          END
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop if it already exists from a previous attempt, then recreate
DROP TRIGGER IF EXISTS trg_auto_reduce_plant_stock ON sales_transactions;

CREATE TRIGGER trg_auto_reduce_plant_stock
AFTER INSERT ON sales_transactions
FOR EACH ROW
EXECUTE FUNCTION auto_reduce_plant_stock();
