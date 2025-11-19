-- ==============================================
-- REFRESH SUPABASE SCHEMA CACHE
-- This may help if Supabase schema cache is stale
-- ==============================================

-- Note: Supabase PostgREST schema cache refreshes automatically,
-- but you can try these steps:

-- Step 1: Verify the column exists
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'sales_transactions'
  AND column_name = 'total_amount';

-- Step 2: Check RLS policies on sales_transactions
SELECT 
    policyname,
    cmd as command,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'sales_transactions';

-- Step 3: Test INSERT manually to verify it works
-- Replace with actual values from your app
INSERT INTO public.sales_transactions (
    customer_id,
    transaction_type,
    amount,
    total_amount,
    quantity,
    sku,
    description,
    transaction_date,
    branch
) VALUES (
    (SELECT id FROM public.customers WHERE is_active = true LIMIT 1),
    'sale',
    100.00,
    100.00,
    10,
    'TEST_SKU',
    'Test transaction - verify schema',
    CURRENT_DATE,
    'TEST_BRANCH'
)
RETURNING *;

-- Clean up test data
DELETE FROM public.sales_transactions 
WHERE description = 'Test transaction - verify schema';

-- Note: If manual INSERT works but app still fails,
-- the issue is Supabase schema cache. It should refresh automatically
-- within a few minutes. You can also try:
-- 1. Restarting your Supabase project (in Supabase dashboard)
-- 2. Waiting 2-3 minutes for cache to refresh
-- 3. Clearing browser cache and refreshing

