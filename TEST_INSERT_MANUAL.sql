-- ==============================================
-- TEST INSERT MANUALLY TO DEBUG 400 ERROR
-- Run this to see if INSERT works from SQL editor
-- ==============================================

-- Test INSERT with exact same data structure as app
INSERT INTO public.factory_pricing (
    pricing_date,
    sku,
    bottles_per_case,
    price_per_bottle,
    tax
) VALUES (
    CURRENT_DATE,
    'TEST_SKU_INSERT',
    12,
    10.50,
    NULL
)
RETURNING *;

-- Check if it was inserted
SELECT * FROM public.factory_pricing WHERE sku = 'TEST_SKU_INSERT';

-- Clean up
DELETE FROM public.factory_pricing WHERE sku = 'TEST_SKU_INSERT';

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

