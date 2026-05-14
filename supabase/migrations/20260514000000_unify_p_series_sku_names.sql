-- ─────────────────────────────────────────────────────────────────────────────
-- Unify P-series SKU naming across every table that stores a sku value.
--
-- Old names (both existed in parallel) → Canonical name
--   '250 P'  / 'P250ml'  →  'P 250 ml'
--   '500 P'  / 'P500ml'  →  'P 500 ml'
--   '750 P'  / 'P750ml'  →  'P 750 ml'
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── 1. Simple text-column tables (no unique constraint on sku) ────────────────

UPDATE sales_transactions SET sku = 'P 250 ml' WHERE sku IN ('250 P', 'P250ml');
UPDATE sales_transactions SET sku = 'P 500 ml' WHERE sku IN ('500 P', 'P500ml');
UPDATE sales_transactions SET sku = 'P 750 ml' WHERE sku IN ('750 P', 'P750ml');

UPDATE orders SET sku = 'P 250 ml' WHERE sku IN ('250 P', 'P250ml');
UPDATE orders SET sku = 'P 500 ml' WHERE sku IN ('500 P', 'P500ml');
UPDATE orders SET sku = 'P 750 ml' WHERE sku IN ('750 P', 'P750ml');

UPDATE factory_pricing SET sku = 'P 250 ml' WHERE sku IN ('250 P', 'P250ml');
UPDATE factory_pricing SET sku = 'P 500 ml' WHERE sku IN ('500 P', 'P500ml');
UPDATE factory_pricing SET sku = 'P 750 ml' WHERE sku IN ('750 P', 'P750ml');

UPDATE production SET sku = 'P 250 ml' WHERE sku IN ('250 P', 'P250ml');
UPDATE production SET sku = 'P 500 ml' WHERE sku IN ('500 P', 'P500ml');
UPDATE production SET sku = 'P 750 ml' WHERE sku IN ('750 P', 'P750ml');

UPDATE label_purchases SET sku = 'P 250 ml' WHERE sku IN ('250 P', 'P250ml');
UPDATE label_purchases SET sku = 'P 500 ml' WHERE sku IN ('500 P', 'P500ml');
UPDATE label_purchases SET sku = 'P 750 ml' WHERE sku IN ('750 P', 'P750ml');

-- ── 2. customers — unique constraint on (dealer_name, area, sku) ─────────────
-- When a dealer has BOTH old names for the same size (same dealer+area), two
-- customer rows must merge into one. For each size:
--   a) pick the "keeper" (MIN id::text per dealer+area group of old names)
--   b) reassign ALL FK references from "discards" → keeper
--      (sales_transactions, label_purchases, transport_expenses,
--       factory_payables, invoices, whatsapp_messages)
--   c) delete the discards
--   d) rename the keepers to canonical

DO $$
DECLARE
  old_skus text[];
  new_sku  text;
  i        int;
BEGIN
  FOR i IN 1..3 LOOP
    IF i = 1 THEN
      old_skus := ARRAY['250 P', 'P250ml'];
      new_sku  := 'P 250 ml';
    ELSIF i = 2 THEN
      old_skus := ARRAY['500 P', 'P500ml'];
      new_sku  := 'P 500 ml';
    ELSE
      old_skus := ARRAY['750 P', 'P750ml'];
      new_sku  := 'P 750 ml';
    END IF;

    -- sales_transactions.customer_id
    UPDATE sales_transactions st
    SET customer_id = keeper.keeper_id
    FROM (
      SELECT c.id AS discard_id, dp.keeper_id
      FROM customers c
      JOIN (
        SELECT dealer_name, area, MIN(id::text)::uuid AS keeper_id
        FROM customers WHERE sku = ANY(old_skus)
        GROUP BY dealer_name, area HAVING COUNT(*) > 1
      ) dp ON c.dealer_name = dp.dealer_name AND c.area = dp.area
      WHERE c.sku = ANY(old_skus) AND c.id != dp.keeper_id
    ) keeper
    WHERE st.customer_id = keeper.discard_id;

    -- label_purchases.client_id
    UPDATE label_purchases lp
    SET client_id = keeper.keeper_id
    FROM (
      SELECT c.id AS discard_id, dp.keeper_id
      FROM customers c
      JOIN (
        SELECT dealer_name, area, MIN(id::text)::uuid AS keeper_id
        FROM customers WHERE sku = ANY(old_skus)
        GROUP BY dealer_name, area HAVING COUNT(*) > 1
      ) dp ON c.dealer_name = dp.dealer_name AND c.area = dp.area
      WHERE c.sku = ANY(old_skus) AND c.id != dp.keeper_id
    ) keeper
    WHERE lp.client_id = keeper.discard_id;

    -- transport_expenses.client_id
    UPDATE transport_expenses te
    SET client_id = keeper.keeper_id
    FROM (
      SELECT c.id AS discard_id, dp.keeper_id
      FROM customers c
      JOIN (
        SELECT dealer_name, area, MIN(id::text)::uuid AS keeper_id
        FROM customers WHERE sku = ANY(old_skus)
        GROUP BY dealer_name, area HAVING COUNT(*) > 1
      ) dp ON c.dealer_name = dp.dealer_name AND c.area = dp.area
      WHERE c.sku = ANY(old_skus) AND c.id != dp.keeper_id
    ) keeper
    WHERE te.client_id = keeper.discard_id;

    -- factory_payables.customer_id
    UPDATE factory_payables fp
    SET customer_id = keeper.keeper_id
    FROM (
      SELECT c.id AS discard_id, dp.keeper_id
      FROM customers c
      JOIN (
        SELECT dealer_name, area, MIN(id::text)::uuid AS keeper_id
        FROM customers WHERE sku = ANY(old_skus)
        GROUP BY dealer_name, area HAVING COUNT(*) > 1
      ) dp ON c.dealer_name = dp.dealer_name AND c.area = dp.area
      WHERE c.sku = ANY(old_skus) AND c.id != dp.keeper_id
    ) keeper
    WHERE fp.customer_id = keeper.discard_id;

    -- invoices.customer_id (only if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='invoices') THEN
      UPDATE invoices inv
      SET customer_id = keeper.keeper_id
      FROM (
        SELECT c.id AS discard_id, dp.keeper_id
        FROM customers c
        JOIN (
          SELECT dealer_name, area, MIN(id::text)::uuid AS keeper_id
          FROM customers WHERE sku = ANY(old_skus)
          GROUP BY dealer_name, area HAVING COUNT(*) > 1
        ) dp ON c.dealer_name = dp.dealer_name AND c.area = dp.area
        WHERE c.sku = ANY(old_skus) AND c.id != dp.keeper_id
      ) keeper
      WHERE inv.customer_id = keeper.discard_id;
    END IF;

    -- whatsapp_messages.customer_id (only if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='whatsapp_messages') THEN
      UPDATE whatsapp_messages wm
      SET customer_id = keeper.keeper_id
      FROM (
        SELECT c.id AS discard_id, dp.keeper_id
        FROM customers c
        JOIN (
          SELECT dealer_name, area, MIN(id::text)::uuid AS keeper_id
          FROM customers WHERE sku = ANY(old_skus)
          GROUP BY dealer_name, area HAVING COUNT(*) > 1
        ) dp ON c.dealer_name = dp.dealer_name AND c.area = dp.area
        WHERE c.sku = ANY(old_skus) AND c.id != dp.keeper_id
      ) keeper
      WHERE wm.customer_id = keeper.discard_id;
    END IF;

    -- Delete discards (all FK refs now point to keeper)
    DELETE FROM customers
    WHERE id IN (
      SELECT c.id
      FROM customers c
      JOIN (
        SELECT dealer_name, area, MIN(id::text)::uuid AS keeper_id
        FROM customers WHERE sku = ANY(old_skus)
        GROUP BY dealer_name, area HAVING COUNT(*) > 1
      ) dp ON c.dealer_name = dp.dealer_name AND c.area = dp.area
      WHERE c.sku = ANY(old_skus) AND c.id != dp.keeper_id
    );

    -- Rename keepers to canonical
    UPDATE customers SET sku = new_sku WHERE sku = ANY(old_skus);
  END LOOP;
END $$;

-- ── 3. invoice_configurations — label_vendors JSON array ─────────────────────

UPDATE invoice_configurations
SET config_value = (
  SELECT jsonb_agg(
    CASE
      WHEN (elem->>'sku') IN ('250 P', 'P250ml') THEN jsonb_set(elem, '{sku}', '"P 250 ml"')
      WHEN (elem->>'sku') IN ('500 P', 'P500ml') THEN jsonb_set(elem, '{sku}', '"P 500 ml"')
      WHEN (elem->>'sku') IN ('750 P', 'P750ml') THEN jsonb_set(elem, '{sku}', '"P 750 ml"')
      ELSE elem
    END
  )::text
  FROM jsonb_array_elements(config_value::jsonb) AS elem
)
WHERE config_key = 'label_vendors';

-- ── 4. sku_configurations — insert canonical names, drop old ones ─────────────

INSERT INTO sku_configurations (sku, description, bottles_per_case)
SELECT
  'P 250 ml',
  COALESCE(
    (SELECT description FROM sku_configurations WHERE sku IN ('250 P','P250ml') AND description IS NOT NULL LIMIT 1),
    'Premium Drinking Water 250 ml'
  ),
  COALESCE(
    (SELECT bottles_per_case FROM sku_configurations WHERE sku IN ('250 P','P250ml') AND bottles_per_case IS NOT NULL LIMIT 1),
    30
  )
WHERE NOT EXISTS (SELECT 1 FROM sku_configurations WHERE sku = 'P 250 ml');

INSERT INTO sku_configurations (sku, description, bottles_per_case)
SELECT
  'P 500 ml',
  COALESCE(
    (SELECT description FROM sku_configurations WHERE sku IN ('500 P','P500ml') AND description IS NOT NULL LIMIT 1),
    'Premium Drinking Water 500 ml'
  ),
  COALESCE(
    (SELECT bottles_per_case FROM sku_configurations WHERE sku IN ('500 P','P500ml') AND bottles_per_case IS NOT NULL LIMIT 1),
    20
  )
WHERE NOT EXISTS (SELECT 1 FROM sku_configurations WHERE sku = 'P 500 ml');

INSERT INTO sku_configurations (sku, description, bottles_per_case)
SELECT
  'P 750 ml',
  COALESCE(
    (SELECT description FROM sku_configurations WHERE sku IN ('750 P','P750ml') AND description IS NOT NULL LIMIT 1),
    'Premium Drinking Water 750 ml'
  ),
  COALESCE(
    (SELECT bottles_per_case FROM sku_configurations WHERE sku IN ('750 P','P750ml') AND bottles_per_case IS NOT NULL LIMIT 1),
    12
  )
WHERE NOT EXISTS (SELECT 1 FROM sku_configurations WHERE sku = 'P 750 ml');

DELETE FROM sku_configurations
WHERE sku IN ('250 P', 'P250ml', '500 P', 'P500ml', '750 P', 'P750ml');

COMMIT;
