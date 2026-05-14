-- Unify additional SKU names across every table that stores a sku value.
--
-- Old name   →  Canonical name
--   '1000 P'   →  'P 1000 ml'
--   '750 AL'   →  'AL 750 ml'
--   '500 AL'   →  'AL 500 ml'
--   'El250ml'  →  'EL 250 ml'
--   '500 EC'   →  'EL 500 ml'

BEGIN;

-- ── 1. Simple text-column tables (no unique constraint on sku) ────────────────

UPDATE sales_transactions SET sku = 'P 1000 ml' WHERE sku = '1000 P';
UPDATE sales_transactions SET sku = 'AL 750 ml'  WHERE sku = '750 AL';
UPDATE sales_transactions SET sku = 'AL 500 ml'  WHERE sku = '500 AL';
UPDATE sales_transactions SET sku = 'EL 250 ml'  WHERE sku = 'El250ml';
UPDATE sales_transactions SET sku = 'EL 500 ml'  WHERE sku = '500 EC';

UPDATE orders SET sku = 'P 1000 ml' WHERE sku = '1000 P';
UPDATE orders SET sku = 'AL 750 ml'  WHERE sku = '750 AL';
UPDATE orders SET sku = 'AL 500 ml'  WHERE sku = '500 AL';
UPDATE orders SET sku = 'EL 250 ml'  WHERE sku = 'El250ml';
UPDATE orders SET sku = 'EL 500 ml'  WHERE sku = '500 EC';

UPDATE factory_pricing SET sku = 'P 1000 ml' WHERE sku = '1000 P';
UPDATE factory_pricing SET sku = 'AL 750 ml'  WHERE sku = '750 AL';
UPDATE factory_pricing SET sku = 'AL 500 ml'  WHERE sku = '500 AL';
UPDATE factory_pricing SET sku = 'EL 250 ml'  WHERE sku = 'El250ml';
UPDATE factory_pricing SET sku = 'EL 500 ml'  WHERE sku = '500 EC';

UPDATE production SET sku = 'P 1000 ml' WHERE sku = '1000 P';
UPDATE production SET sku = 'AL 750 ml'  WHERE sku = '750 AL';
UPDATE production SET sku = 'AL 500 ml'  WHERE sku = '500 AL';
UPDATE production SET sku = 'EL 250 ml'  WHERE sku = 'El250ml';
UPDATE production SET sku = 'EL 500 ml'  WHERE sku = '500 EC';

UPDATE label_purchases SET sku = 'P 1000 ml' WHERE sku = '1000 P';
UPDATE label_purchases SET sku = 'AL 750 ml'  WHERE sku = '750 AL';
UPDATE label_purchases SET sku = 'AL 500 ml'  WHERE sku = '500 AL';
UPDATE label_purchases SET sku = 'EL 250 ml'  WHERE sku = 'El250ml';
UPDATE label_purchases SET sku = 'EL 500 ml'  WHERE sku = '500 EC';

-- ── 2. customers — unique constraint on (dealer_name, area, sku) ─────────────
-- For each old SKU: if a canonical row already exists for the same dealer+area,
-- reassign all FK references from the old row to the canonical row, then delete
-- the old row. Otherwise, simply rename the old row.

DO $$
DECLARE
  old_sku  text;
  new_sku  text;
  i        int;
BEGIN
  FOR i IN 1..5 LOOP
    IF i = 1 THEN
      old_sku := '1000 P';   new_sku := 'P 1000 ml';
    ELSIF i = 2 THEN
      old_sku := '750 AL';   new_sku := 'AL 750 ml';
    ELSIF i = 3 THEN
      old_sku := '500 AL';   new_sku := 'AL 500 ml';
    ELSIF i = 4 THEN
      old_sku := 'El250ml';  new_sku := 'EL 250 ml';
    ELSE
      old_sku := '500 EC';   new_sku := 'EL 500 ml';
    END IF;

    -- sales_transactions.customer_id
    UPDATE sales_transactions st
    SET customer_id = keeper.keeper_id
    FROM (
      SELECT c.id AS discard_id, canonical.id AS keeper_id
      FROM customers c
      JOIN customers canonical
        ON canonical.dealer_name = c.dealer_name
       AND canonical.area        = c.area
       AND canonical.sku         = new_sku
      WHERE c.sku = old_sku
    ) keeper
    WHERE st.customer_id = keeper.discard_id;

    -- label_purchases.client_id
    UPDATE label_purchases lp
    SET client_id = keeper.keeper_id
    FROM (
      SELECT c.id AS discard_id, canonical.id AS keeper_id
      FROM customers c
      JOIN customers canonical
        ON canonical.dealer_name = c.dealer_name
       AND canonical.area        = c.area
       AND canonical.sku         = new_sku
      WHERE c.sku = old_sku
    ) keeper
    WHERE lp.client_id = keeper.discard_id;

    -- transport_expenses.client_id
    UPDATE transport_expenses te
    SET client_id = keeper.keeper_id
    FROM (
      SELECT c.id AS discard_id, canonical.id AS keeper_id
      FROM customers c
      JOIN customers canonical
        ON canonical.dealer_name = c.dealer_name
       AND canonical.area        = c.area
       AND canonical.sku         = new_sku
      WHERE c.sku = old_sku
    ) keeper
    WHERE te.client_id = keeper.discard_id;

    -- factory_payables.customer_id
    UPDATE factory_payables fp
    SET customer_id = keeper.keeper_id
    FROM (
      SELECT c.id AS discard_id, canonical.id AS keeper_id
      FROM customers c
      JOIN customers canonical
        ON canonical.dealer_name = c.dealer_name
       AND canonical.area        = c.area
       AND canonical.sku         = new_sku
      WHERE c.sku = old_sku
    ) keeper
    WHERE fp.customer_id = keeper.discard_id;

    -- invoices.customer_id (guard: table may not exist)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
      UPDATE invoices inv
      SET customer_id = keeper.keeper_id
      FROM (
        SELECT c.id AS discard_id, canonical.id AS keeper_id
        FROM customers c
        JOIN customers canonical
          ON canonical.dealer_name = c.dealer_name
         AND canonical.area        = c.area
         AND canonical.sku         = new_sku
        WHERE c.sku = old_sku
      ) keeper
      WHERE inv.customer_id = keeper.discard_id;
    END IF;

    -- whatsapp_messages.customer_id (guard: table may not exist)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'whatsapp_messages') THEN
      UPDATE whatsapp_messages wm
      SET customer_id = keeper.keeper_id
      FROM (
        SELECT c.id AS discard_id, canonical.id AS keeper_id
        FROM customers c
        JOIN customers canonical
          ON canonical.dealer_name = c.dealer_name
         AND canonical.area        = c.area
         AND canonical.sku         = new_sku
        WHERE c.sku = old_sku
      ) keeper
      WHERE wm.customer_id = keeper.discard_id;
    END IF;

    -- Delete old customer rows where a canonical row already exists for the same dealer+area
    DELETE FROM customers c
    WHERE c.sku = old_sku
      AND EXISTS (
        SELECT 1 FROM customers canonical
        WHERE canonical.dealer_name = c.dealer_name
          AND canonical.area        = c.area
          AND canonical.sku         = new_sku
      );

    -- Rename remaining old-sku rows (no canonical counterpart existed)
    UPDATE customers SET sku = new_sku WHERE sku = old_sku;

  END LOOP;
END $$;

-- ── 3. invoice_configurations — label_vendors JSON array ─────────────────────

UPDATE invoice_configurations
SET config_value = (
  SELECT jsonb_agg(
    CASE
      WHEN (elem->>'sku') = '1000 P'  THEN jsonb_set(elem, '{sku}', '"P 1000 ml"')
      WHEN (elem->>'sku') = '750 AL'  THEN jsonb_set(elem, '{sku}', '"AL 750 ml"')
      WHEN (elem->>'sku') = '500 AL'  THEN jsonb_set(elem, '{sku}', '"AL 500 ml"')
      WHEN (elem->>'sku') = 'El250ml' THEN jsonb_set(elem, '{sku}', '"EL 250 ml"')
      WHEN (elem->>'sku') = '500 EC'  THEN jsonb_set(elem, '{sku}', '"EL 500 ml"')
      ELSE elem
    END
  )::text
  FROM jsonb_array_elements(config_value::jsonb) AS elem
)
WHERE config_key = 'label_vendors';

-- ── 4. sku_configurations — insert canonical rows, drop old ones ──────────────

INSERT INTO sku_configurations (sku, description, bottles_per_case)
SELECT
  'P 1000 ml',
  COALESCE((SELECT description FROM sku_configurations WHERE sku = '1000 P' AND description IS NOT NULL LIMIT 1), 'Premium Drinking Water 1000 ml'),
  COALESCE((SELECT bottles_per_case FROM sku_configurations WHERE sku = '1000 P' AND bottles_per_case IS NOT NULL LIMIT 1), 0)
WHERE NOT EXISTS (SELECT 1 FROM sku_configurations WHERE sku = 'P 1000 ml');

INSERT INTO sku_configurations (sku, description, bottles_per_case)
SELECT
  'AL 750 ml',
  COALESCE((SELECT description FROM sku_configurations WHERE sku = '750 AL' AND description IS NOT NULL LIMIT 1), 'Aluminium 750 ml'),
  COALESCE((SELECT bottles_per_case FROM sku_configurations WHERE sku = '750 AL' AND bottles_per_case IS NOT NULL LIMIT 1), 0)
WHERE NOT EXISTS (SELECT 1 FROM sku_configurations WHERE sku = 'AL 750 ml');

INSERT INTO sku_configurations (sku, description, bottles_per_case)
SELECT
  'AL 500 ml',
  COALESCE((SELECT description FROM sku_configurations WHERE sku = '500 AL' AND description IS NOT NULL LIMIT 1), 'Aluminium 500 ml'),
  COALESCE((SELECT bottles_per_case FROM sku_configurations WHERE sku = '500 AL' AND bottles_per_case IS NOT NULL LIMIT 1), 0)
WHERE NOT EXISTS (SELECT 1 FROM sku_configurations WHERE sku = 'AL 500 ml');

INSERT INTO sku_configurations (sku, description, bottles_per_case)
SELECT
  'EL 250 ml',
  COALESCE((SELECT description FROM sku_configurations WHERE sku = 'El250ml' AND description IS NOT NULL LIMIT 1), 'EL 250 ml'),
  COALESCE((SELECT bottles_per_case FROM sku_configurations WHERE sku = 'El250ml' AND bottles_per_case IS NOT NULL LIMIT 1), 0)
WHERE NOT EXISTS (SELECT 1 FROM sku_configurations WHERE sku = 'EL 250 ml');

INSERT INTO sku_configurations (sku, description, bottles_per_case)
SELECT
  'EL 500 ml',
  COALESCE((SELECT description FROM sku_configurations WHERE sku = '500 EC' AND description IS NOT NULL LIMIT 1), 'EL 500 ml'),
  COALESCE((SELECT bottles_per_case FROM sku_configurations WHERE sku = '500 EC' AND bottles_per_case IS NOT NULL LIMIT 1), 0)
WHERE NOT EXISTS (SELECT 1 FROM sku_configurations WHERE sku = 'EL 500 ml');

DELETE FROM sku_configurations WHERE sku IN ('1000 P', '750 AL', '500 AL', 'El250ml', '500 EC');

COMMIT;
