-- REQUIRED: Run this once in Supabase SQL Editor to fix order creation 400 errors.
-- Dashboard → SQL Editor → New query → Paste this → Run
--
-- Your orders table already has the correct columns.
-- This adds the insert_orders RPC (bypasses PostgREST column validation).
-- Populates client_name (NOT NULL), client, tentative_delivery_date, and
-- tentative_delivery_time when both date columns exist.

DROP FUNCTION IF EXISTS insert_orders(jsonb);
CREATE OR REPLACE FUNCTION insert_orders(orders_json jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  rec jsonb;
  new_id uuid;
  ids uuid[] := '{}';
  delivery_date date;
  has_tentative_time boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'tentative_delivery_time') INTO has_tentative_time;
  FOR rec IN SELECT * FROM jsonb_array_elements(orders_json)
  LOOP
    delivery_date := (rec->>'tentative_delivery_date')::date;
    IF has_tentative_time THEN
      INSERT INTO orders (client_name, client, area, sku, number_of_cases, date, tentative_delivery_date, tentative_delivery_time, status)
      VALUES (
        (rec->>'client')::text,
        (rec->>'client')::text,
        (rec->>'area')::text,
        (rec->>'sku')::text,
        COALESCE((rec->>'number_of_cases')::integer, 0),
        COALESCE((rec->>'date')::date, CURRENT_DATE),
        delivery_date,
        delivery_date,
        COALESCE((rec->>'status')::text, 'pending')
      )
      RETURNING id INTO new_id;
    ELSE
      INSERT INTO orders (client_name, client, area, sku, number_of_cases, date, tentative_delivery_date, status)
      VALUES (
        (rec->>'client')::text,
        (rec->>'client')::text,
        (rec->>'area')::text,
        (rec->>'sku')::text,
        COALESCE((rec->>'number_of_cases')::integer, 0),
        COALESCE((rec->>'date')::date, CURRENT_DATE),
        delivery_date,
        COALESCE((rec->>'status')::text, 'pending')
      )
      RETURNING id INTO new_id;
    END IF;
    ids := array_append(ids, new_id);
  END LOOP;
  RETURN jsonb_build_object('ids', ids);
END;
$$;
GRANT EXECUTE ON FUNCTION insert_orders(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_orders(jsonb) TO anon;
