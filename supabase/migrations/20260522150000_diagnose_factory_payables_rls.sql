-- 1. FK nullability for customer_id
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'factory_payables'
  AND column_name  = 'customer_id';

-- 2. RLS status and policies on factory_payables
SELECT relrowsecurity AS rls_enabled, relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relname = 'factory_payables' AND relnamespace = 'public'::regnamespace;

SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'factory_payables';

-- 3. Identify the 3 missing production rows by comparing all IDs
-- to what PostgREST would return (only rows whose customer_id exists in customers)
-- This helps confirm which exact rows are being dropped
SELECT fp.id, fp.sku, fp.quantity, fp.amount, fp.transaction_date::date, fp.customer_id,
       CASE WHEN c.id IS NULL THEN 'missing customer' ELSE 'ok' END AS customer_status
FROM public.factory_payables fp
LEFT JOIN public.customers c ON c.id = fp.customer_id
WHERE fp.transaction_type = 'production'
  AND c.id IS NULL;
