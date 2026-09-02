-- Drop 4 redundant/unused columns from the orders table.
--
-- area             : always a duplicate of branch (insert_orders RPC sets both to the
--                    same value). App code reads branch, never area. Last "dealer"-era
--                    column in the live schema.
-- client_name      : always a duplicate of client (RPC sets both to the same value).
--                    App code reads client, never client_name.
-- date             : duplicate of order_date with a CURRENT_DATE default. RPC never
--                    sets it; app never reads it.
-- tentative_delivery_time : misnamed column (it is a date, not a time). Never set by
--                    the RPC or read by the app; just carries its CURRENT_DATE default.
--
-- The insert_orders RPC is recreated below without these columns so INSERTs continue
-- to work.

-- 1. Drop the dead columns
ALTER TABLE public.orders DROP COLUMN IF EXISTS area;
ALTER TABLE public.orders DROP COLUMN IF EXISTS client_name;
ALTER TABLE public.orders DROP COLUMN IF EXISTS date;
ALTER TABLE public.orders DROP COLUMN IF EXISTS tentative_delivery_time;

-- 2. Recreate insert_orders without the dropped columns
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
      branch,
      sku,
      number_of_cases,
      order_date,
      tentative_delivery_date,
      status
    )
    VALUES (
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

GRANT EXECUTE ON FUNCTION public.insert_orders(jsonb) TO anon, authenticated;
