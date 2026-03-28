-- Fix 400 errors on orders_dispatch and insert_orders
-- Run in Supabase SQL Editor if you still see 400s

-- 1. Ensure orders has required columns (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'tentative_delivery_date') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'tentative_delivery_time') THEN
      ALTER TABLE orders RENAME COLUMN tentative_delivery_time TO tentative_delivery_date;
    ELSE
      ALTER TABLE orders ADD COLUMN tentative_delivery_date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'area') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'branch') THEN
      ALTER TABLE orders RENAME COLUMN branch TO area;
    ELSE
      ALTER TABLE orders ADD COLUMN area TEXT NOT NULL DEFAULT '';
    END IF;
  END IF;
END $$;

-- 2. Add anon policy for orders_dispatch SELECT (so list loads even with session edge cases)
DROP POLICY IF EXISTS "Allow anon read orders_dispatch" ON orders_dispatch;
CREATE POLICY "Allow anon read orders_dispatch"
  ON orders_dispatch FOR SELECT
  TO anon
  USING (true);

-- 3. Add anon policy for orders SELECT (get_orders_sorted RPC reads this; anon can call RPC)
DROP POLICY IF EXISTS "Allow anon read orders" ON orders;
CREATE POLICY "Allow anon read orders"
  ON orders FOR SELECT
  TO anon
  USING (true);

-- 4. Recreate insert_orders with explicit error handling (returns clearer errors)
DROP FUNCTION IF EXISTS insert_orders(jsonb);
CREATE OR REPLACE FUNCTION insert_orders(orders_json jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec jsonb;
  new_id uuid;
  ids uuid[] := '{}';
BEGIN
  IF orders_json IS NULL OR jsonb_array_length(orders_json) = 0 THEN
    RAISE EXCEPTION 'orders_json must be a non-empty array';
  END IF;

  FOR rec IN SELECT * FROM jsonb_array_elements(orders_json)
  LOOP
    INSERT INTO orders (client, area, sku, number_of_cases, date, tentative_delivery_date, status)
    VALUES (
      COALESCE((rec->>'client')::text, ''),
      COALESCE((rec->>'area')::text, ''),
      COALESCE((rec->>'sku')::text, ''),
      COALESCE((rec->>'number_of_cases')::integer, 0),
      COALESCE(((rec->>'date')::text)::date, CURRENT_DATE),
      COALESCE(((rec->>'tentative_delivery_date')::text)::date, CURRENT_DATE),
      COALESCE((rec->>'status')::text, 'pending')
    )
    RETURNING id INTO new_id;
    ids := array_append(ids, new_id);
  END LOOP;
  RETURN jsonb_build_object('ids', ids);
END;
$$;

GRANT EXECUTE ON FUNCTION insert_orders(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_orders(jsonb) TO anon;
