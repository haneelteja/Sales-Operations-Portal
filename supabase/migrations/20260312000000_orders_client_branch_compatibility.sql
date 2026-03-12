-- Restore client/branch terminology for order management while keeping
-- compatibility with existing area-based data.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'area'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'branch'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN branch TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders_dispatch'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders_dispatch' AND column_name = 'area'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders_dispatch' AND column_name = 'branch'
  ) THEN
    ALTER TABLE public.orders_dispatch ADD COLUMN branch TEXT;
  END IF;
END $$;

UPDATE public.orders
SET branch = COALESCE(branch, area)
WHERE branch IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders_dispatch'
  ) THEN
    UPDATE public.orders_dispatch
    SET branch = COALESCE(branch, area)
    WHERE branch IS NULL;
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.get_orders_sorted();
CREATE OR REPLACE FUNCTION public.get_orders_sorted()
RETURNS TABLE (
  id uuid,
  date date,
  client text,
  branch text,
  sku text,
  number_of_cases integer,
  tentative_delivery_date date,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.date,
    o.client AS client,
    COALESCE(o.branch, o.area) AS branch,
    o.sku,
    o.number_of_cases,
    o.tentative_delivery_date,
    COALESCE(o.status, 'pending')::text,
    o.created_at,
    o.updated_at
  FROM public.orders o
  ORDER BY
    CASE WHEN COALESCE(o.status, 'pending') = 'pending' THEN 0 ELSE 1 END,
    o.tentative_delivery_date DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_orders_sorted() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_orders_sorted() TO anon;

DROP FUNCTION IF EXISTS public.insert_orders(jsonb);
CREATE OR REPLACE FUNCTION public.insert_orders(orders_json jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec jsonb;
  new_id uuid;
  ids uuid[] := '{}';
  branch_value text;
BEGIN
  IF orders_json IS NULL OR jsonb_array_length(orders_json) = 0 THEN
    RAISE EXCEPTION 'orders_json must be a non-empty array';
  END IF;

  FOR rec IN SELECT * FROM jsonb_array_elements(orders_json)
  LOOP
    branch_value := COALESCE((rec->>'branch')::text, (rec->>'area')::text, '');

    INSERT INTO public.orders (
      client,
      area,
      branch,
      sku,
      number_of_cases,
      date,
      tentative_delivery_date,
      status
    )
    VALUES (
      COALESCE((rec->>'client')::text, ''),
      branch_value,
      branch_value,
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

GRANT EXECUTE ON FUNCTION public.insert_orders(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_orders(jsonb) TO anon;
