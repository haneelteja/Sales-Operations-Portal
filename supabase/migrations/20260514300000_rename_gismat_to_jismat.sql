-- Rename dealer name "Gismat" → "Jismat" for Ameerpet and Dilshuknagar only.
--
-- Tables that use customer_id FK (sales_transactions, factory_payables,
-- transport_expenses, label_purchases, invoices) automatically reflect the
-- new name through the FK join — no direct update needed for those.
--
-- Tables that store dealer name as raw text need explicit updates.

BEGIN;

-- ── 1. customers — primary source of truth ───────────────────────────────────
UPDATE customers
SET dealer_name = 'Jismat'
WHERE dealer_name = 'Gismat'
  AND area IN ('Ameerpet', 'Dilshuknagar');

-- Sync compatibility column (client_name) if it exists on the table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'client_name'
  ) THEN
    UPDATE customers SET client_name = 'Jismat'
    WHERE client_name = 'Gismat' AND area IN ('Ameerpet', 'Dilshuknagar');
  END IF;
END $$;

-- ── 2. orders — stores client as raw text, not FK ────────────────────────────
UPDATE orders
SET client = 'Jismat'
WHERE client = 'Gismat'
  AND area IN ('Ameerpet', 'Dilshuknagar');

-- ── 3. orders_dispatch — stores client as raw text, not FK ──────────────────
-- Uses dynamic SQL because the remote table may lack an 'area' column
-- (created via IF NOT EXISTS before area was added). "Gismat" only exists
-- for Ameerpet and Dilshuknagar so filtering by area is not required.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders_dispatch') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'orders_dispatch' AND column_name = 'area'
    ) THEN
      EXECUTE $sql$
        UPDATE orders_dispatch SET client = 'Jismat'
        WHERE client = 'Gismat' AND area IN ('Ameerpet', 'Dilshuknagar')
      $sql$;
    ELSE
      EXECUTE $sql$
        UPDATE orders_dispatch SET client = 'Jismat' WHERE client = 'Gismat'
      $sql$;
    END IF;
  END IF;
END $$;

-- ── 4. whatsapp_message_logs — stores denormalized customer_name copy ────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'whatsapp_message_logs') THEN
    UPDATE whatsapp_message_logs wml
    SET customer_name = 'Jismat'
    FROM customers c
    WHERE wml.customer_id = c.id
      AND c.dealer_name   = 'Jismat'   -- already renamed in step 1
      AND c.area          IN ('Ameerpet', 'Dilshuknagar')
      AND wml.customer_name = 'Gismat';
  END IF;
END $$;

COMMIT;
