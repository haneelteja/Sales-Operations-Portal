-- Backfill order_date from created_at for any rows where it is still null
UPDATE public.orders_dispatch
SET order_date = created_at::date
WHERE order_date IS NULL;

-- Backfill sku from customers where the client+branch combo maps to exactly one active SKU
UPDATE public.orders_dispatch od
SET sku = (
  SELECT c.sku
  FROM public.customers c
  WHERE c.client_name = od.client
    AND c.branch = od.branch
    AND c.is_active = true
    AND c.sku IS NOT NULL
    AND c.sku <> ''
  LIMIT 1
)
WHERE (od.sku IS NULL OR od.sku = '')
  AND (
    SELECT COUNT(DISTINCT c.sku)
    FROM public.customers c
    WHERE c.client_name = od.client
      AND c.branch = od.branch
      AND c.is_active = true
      AND c.sku IS NOT NULL
      AND c.sku <> ''
  ) = 1;
