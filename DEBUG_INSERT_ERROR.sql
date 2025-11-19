-- ==============================================
-- DEBUG INSERT ERROR FOR FACTORY_PRICING
-- Run this to check what's causing the 400 error
-- ==============================================

-- Check table structure and constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    is_generated,
    generation_expression
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'factory_pricing'
ORDER BY ordinal_position;

-- Check constraints
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.factory_pricing'::regclass;

-- Check RLS policies for INSERT
SELECT 
    policyname,
    cmd as command,
    roles,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'factory_pricing'
  AND cmd = 'INSERT';

-- Test INSERT manually (this should work if RLS is correct)
INSERT INTO public.factory_pricing (
    sku,
    bottles_per_case,
    price_per_bottle,
    pricing_date,
    tax
) VALUES (
    'TEST_SKU',
    12,
    10.50,
    CURRENT_DATE,
    NULL
);

-- Check if it was inserted
SELECT * FROM public.factory_pricing WHERE sku = 'TEST_SKU';

-- Clean up test data
DELETE FROM public.factory_pricing WHERE sku = 'TEST_SKU';

