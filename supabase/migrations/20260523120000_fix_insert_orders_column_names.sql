-- Fix insert_orders RPC after schema_cleanup renamed:
--   orders.date  → orders.order_date
--   orders.area  → orders.branch
-- Also: live DB has a client_name column (NOT NULL) that must be populated.

DROP FUNCTION IF EXISTS public.insert_orders(jsonb);
CREATE OR REPLACE FUNCTION public.insert_orders(orders_json jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec        jsonb;
  new_id     uuid;
  ids        uuid[] := '{}';
  branch_val text;
  date_val   date;
  client_val text;
BEGIN
  IF orders_json IS NULL OR jsonb_array_length(orders_json) = 0 THEN
    RAISE EXCEPTION 'orders_json must be a non-empty array';
  END IF;

  FOR rec IN SELECT * FROM jsonb_array_elements(orders_json)
  LOOP
    client_val := COALESCE(NULLIF(trim((rec->>'client')::text), ''), '');
    branch_val := COALESCE(
      NULLIF(trim((rec->>'branch')::text), ''),
      NULLIF(trim((rec->>'area')::text),   ''),
      ''
    );
    date_val := COALESCE(
      ((rec->>'order_date')::text)::date,
      ((rec->>'date')::text)::date,
      CURRENT_DATE
    );

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
      COALESCE(NULLIF(trim((rec->>'sku')::text), ''), ''),
      COALESCE((rec->>'number_of_cases')::integer, 0),
      date_val,
      COALESCE(((rec->>'tentative_delivery_date')::text)::date, CURRENT_DATE),
      COALESCE(NULLIF((rec->>'status')::text, ''), 'pending')
    )
    RETURNING id INTO new_id;

    ids := array_append(ids, new_id);
  END LOOP;

  RETURN jsonb_build_object('ids', ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_orders(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_orders(jsonb) TO anon;
