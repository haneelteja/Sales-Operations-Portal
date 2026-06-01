-- Fix orders table: backfill any rows where SKU, cases, order_date, or
-- tentative_delivery_date are null/empty due to older insert_orders versions.
-- Also rebuilds get_orders_sorted and insert_orders with safe column handling.

-- 1. Add order_date if still missing (renamed from 'date' by schema_cleanup, but guard anyway)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'order_date'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'date'
    ) THEN
      ALTER TABLE public.orders RENAME COLUMN date TO order_date;
    ELSE
      ALTER TABLE public.orders ADD COLUMN order_date DATE DEFAULT CURRENT_DATE;
    END IF;
  END IF;
END $$;

-- 2. Add tentative_delivery_date if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'tentative_delivery_date'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'tentative_delivery_time'
    ) THEN
      ALTER TABLE public.orders ADD COLUMN tentative_delivery_date DATE;
      UPDATE public.orders SET tentative_delivery_date = tentative_delivery_time WHERE tentative_delivery_date IS NULL;
    ELSE
      ALTER TABLE public.orders ADD COLUMN tentative_delivery_date DATE DEFAULT CURRENT_DATE;
    END IF;
  END IF;
END $$;

-- 3. Add branch if missing (may coexist with area)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'branch'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN branch TEXT;
  END IF;
END $$;

-- 4. Add client_name if missing (live DB may have it as NOT NULL — add nullable first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'client_name'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN client_name TEXT;
  END IF;
END $$;

-- 5. Backfill: client_name from client where null
UPDATE public.orders
SET client_name = client
WHERE client_name IS NULL OR client_name = '';

-- 6. Backfill: branch from area where null
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'area'
  ) THEN
    UPDATE public.orders
    SET branch = area
    WHERE (branch IS NULL OR branch = '') AND (area IS NOT NULL AND area != '');
  END IF;
END $$;

-- 7. Backfill: order_date from created_at where null
UPDATE public.orders
SET order_date = created_at::date
WHERE order_date IS NULL;

-- 8. Backfill: tentative_delivery_date where null
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'tentative_delivery_time'
  ) THEN
    UPDATE public.orders
    SET tentative_delivery_date = tentative_delivery_time
    WHERE tentative_delivery_date IS NULL AND tentative_delivery_time IS NOT NULL;
  END IF;
END $$;

UPDATE public.orders
SET tentative_delivery_date = order_date
WHERE tentative_delivery_date IS NULL;

-- 9. Rebuild get_orders_sorted with safe fallbacks
DROP FUNCTION IF EXISTS get_orders_sorted();
CREATE OR REPLACE FUNCTION get_orders_sorted()
RETURNS TABLE (
  id UUID,
  order_date DATE,
  client TEXT,
  branch TEXT,
  sku TEXT,
  number_of_cases INTEGER,
  tentative_delivery_date DATE,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  customer_id UUID
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id,
    COALESCE(o.order_date, o.created_at::date)::date          AS order_date,
    COALESCE(o.client, o.client_name, '')                      AS client,
    COALESCE(NULLIF(o.branch, ''), '')::TEXT                   AS branch,
    COALESCE(NULLIF(o.sku, ''), '')::TEXT                      AS sku,
    COALESCE(o.number_of_cases, 0)                             AS number_of_cases,
    COALESCE(o.tentative_delivery_date, o.order_date, o.created_at::date)::date AS tentative_delivery_date,
    COALESCE(NULLIF(o.status, ''), 'pending')::TEXT            AS status,
    o.created_at,
    o.updated_at,
    o.customer_id
  FROM public.orders o
  ORDER BY o.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_orders_sorted() TO authenticated;
GRANT EXECUTE ON FUNCTION get_orders_sorted() TO anon;

-- 10. Rebuild insert_orders with correct column names
DROP FUNCTION IF EXISTS public.insert_orders(jsonb);
CREATE OR REPLACE FUNCTION public.insert_orders(orders_json jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec           jsonb;
  new_id        uuid;
  ids           uuid[]  := '{}';
  client_val    text;
  branch_val    text;
  sku_val       text;
  cases_val     integer;
  date_val      date;
  delivery_val  date;
  status_val    text;
BEGIN
  IF orders_json IS NULL OR jsonb_array_length(orders_json) = 0 THEN
    RAISE EXCEPTION 'orders_json must be a non-empty array';
  END IF;

  FOR rec IN SELECT * FROM jsonb_array_elements(orders_json)
  LOOP
    client_val   := COALESCE(NULLIF(trim((rec->>'client')::text), ''), '');
    branch_val   := COALESCE(
                     NULLIF(trim((rec->>'branch')::text), ''),
                     NULLIF(trim((rec->>'area')::text),   ''),
                     ''
                   );
    sku_val      := COALESCE(NULLIF(trim((rec->>'sku')::text), ''), '');
    cases_val    := COALESCE((rec->>'number_of_cases')::integer, 0);
    date_val     := COALESCE(
                     ((rec->>'order_date')::text)::date,
                     ((rec->>'date')::text)::date,
                     CURRENT_DATE
                   );
    delivery_val := COALESCE(
                     ((rec->>'tentative_delivery_date')::text)::date,
                     date_val + INTERVAL '5 days'
                   );
    status_val   := COALESCE(NULLIF((rec->>'status')::text, ''), 'pending');

    INSERT INTO public.orders (
      client,
      client_name,
      branch,
      sku,
      number_of_cases,
      order_date,
      tentative_delivery_date,
      status
    )
    VALUES (
      client_val,
      client_val,
      branch_val,
      sku_val,
      cases_val,
      date_val,
      delivery_val,
      status_val
    )
    RETURNING id INTO new_id;

    ids := array_append(ids, new_id);
  END LOOP;

  RETURN jsonb_build_object('ids', ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_orders(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_orders(jsonb) TO anon;
