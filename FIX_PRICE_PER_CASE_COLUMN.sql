-- ==============================================
-- FIX PRICE_PER_CASE COLUMN ISSUE
-- The table has price_per_case with NOT NULL constraint
-- but we're using cost_per_case (generated) instead
-- ==============================================

-- Step 1: Check if price_per_case column exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'factory_pricing'
  AND column_name IN ('price_per_case', 'cost_per_case')
ORDER BY column_name;

-- Step 2: Check if price_per_case has data
SELECT 
    COUNT(*) as total_rows,
    COUNT(price_per_case) as rows_with_price_per_case,
    COUNT(cost_per_case) as rows_with_cost_per_case
FROM public.factory_pricing;

-- Step 3: Option A - Make price_per_case nullable (if we want to keep it)
-- ALTER TABLE public.factory_pricing
--   ALTER COLUMN price_per_case DROP NOT NULL;

-- Step 4: Option B - Drop price_per_case column (recommended since we have cost_per_case)
-- First, check if there are any dependencies
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.factory_pricing'::regclass
  AND (conname LIKE '%price_per_case%' OR pg_get_constraintdef(oid) LIKE '%price_per_case%');

-- Drop the column (this will fail if there are constraints)
ALTER TABLE public.factory_pricing
  DROP COLUMN IF EXISTS price_per_case;

-- Step 5: Verify the column is gone
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'factory_pricing'
ORDER BY ordinal_position;

-- Step 6: Test INSERT again
INSERT INTO public.factory_pricing (
    pricing_date,
    sku,
    bottles_per_case,
    price_per_bottle,
    tax
) VALUES (
    CURRENT_DATE,
    'TEST_SKU_AFTER_FIX',
    12,
    10.50,
    NULL
)
RETURNING *;

-- Clean up test data
DELETE FROM public.factory_pricing WHERE sku = 'TEST_SKU_AFTER_FIX';

