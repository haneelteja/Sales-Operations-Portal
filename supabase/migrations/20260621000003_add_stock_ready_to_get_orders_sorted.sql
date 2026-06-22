-- stock_ready column was added in 20260618050000_add_stock_ready_to_orders.sql but
-- get_orders_sorted() was last rebuilt in 20260601000000 and never included the column.
-- Rebuild the function to expose stock_ready so the toggle works on the landing page.

DROP FUNCTION IF EXISTS get_orders_sorted();
CREATE OR REPLACE FUNCTION get_orders_sorted()
RETURNS TABLE (
  id                      UUID,
  order_date              DATE,
  client                  TEXT,
  branch                  TEXT,
  sku                     TEXT,
  number_of_cases         INTEGER,
  tentative_delivery_date DATE,
  status                  TEXT,
  created_at              TIMESTAMPTZ,
  updated_at              TIMESTAMPTZ,
  customer_id             UUID,
  stock_ready             BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id,
    COALESCE(o.order_date, o.created_at::date)::date                              AS order_date,
    COALESCE(o.client, o.client_name, '')                                         AS client,
    COALESCE(NULLIF(o.branch, ''), '')::TEXT                                      AS branch,
    COALESCE(NULLIF(o.sku, ''), '')::TEXT                                         AS sku,
    COALESCE(o.number_of_cases, 0)                                                AS number_of_cases,
    COALESCE(o.tentative_delivery_date, o.order_date, o.created_at::date)::date   AS tentative_delivery_date,
    COALESCE(NULLIF(o.status, ''), 'pending')::TEXT                               AS status,
    o.created_at,
    o.updated_at,
    o.customer_id,
    COALESCE(o.stock_ready, false)                                                AS stock_ready
  FROM public.orders o
  ORDER BY o.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_orders_sorted() TO authenticated;
GRANT EXECUTE ON FUNCTION get_orders_sorted() TO anon;
