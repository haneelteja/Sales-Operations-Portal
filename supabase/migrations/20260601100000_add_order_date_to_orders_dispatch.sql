-- Add order_date to orders_dispatch so dispatched records retain the original order date.
ALTER TABLE public.orders_dispatch
ADD COLUMN IF NOT EXISTS order_date DATE;

-- Backfill existing rows from created_at
UPDATE public.orders_dispatch
SET order_date = created_at::date
WHERE order_date IS NULL;
