-- Fix: remove invalid NEW.invoice_number reference (that column is in the
-- invoices table, not sales_transactions) and wrap the INSERT in an exception
-- handler so a plant-stock failure never blocks the parent sale transaction.

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
  IF NEW.transaction_type = 'sale'
     AND NEW.sku IS NOT NULL
     AND NEW.quantity IS NOT NULL
     AND NEW.quantity > 0
     AND NEW.customer_id IS NOT NULL
  THEN
    SELECT quantity INTO v_current_qty
    FROM factory_payables
    WHERE customer_id      = NEW.customer_id
      AND sku              = NEW.sku
      AND transaction_type = 'plant_stock'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_current_qty IS NOT NULL THEN
      v_new_qty := GREATEST(0, v_current_qty - NEW.quantity);

      BEGIN
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
          'Auto-reduced: ' || NEW.quantity || ' cases sold on ' || NEW.transaction_date::TEXT
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'auto_reduce_plant_stock: failed to insert plant_stock row: %', SQLERRM;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
