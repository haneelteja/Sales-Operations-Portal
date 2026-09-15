-- get_orders_sorted still referenced o.client_name which was dropped in
-- 20260902160000_drop_unused_orders_columns.sql, causing a 400 on the Orders page.
-- Rebuild the function using only columns that exist on the current orders table.
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
    COALESCE(NULLIF(o.client, ''), '')::TEXT                                      AS client,
    COALESCE(NULLIF(o.branch, ''), '')::TEXT                                      AS branch,
    COALESCE(NULLIF(o.sku,    ''), '')::TEXT                                      AS sku,
    COALESCE(o.number_of_cases, 0)                                                AS number_of_cases,
    COALESCE(o.tentative_delivery_date, o.order_date, o.created_at::date)::date   AS tentative_delivery_date,
    COALESCE(NULLIF(o.status, ''), 'pending')::TEXT                               AS status,
    o.created_at,
    o.updated_at,
    o.customer_id,
    COALESCE(o.stock_ready, false)                                                AS stock_ready
  FROM public.orders o
  ORDER BY
    CASE WHEN COALESCE(NULLIF(o.status, ''), 'pending') = 'pending' THEN 0 ELSE 1 END,
    o.tentative_delivery_date DESC NULLS LAST,
    o.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_orders_sorted() TO authenticated;
GRANT EXECUTE ON FUNCTION get_orders_sorted() TO anon;
