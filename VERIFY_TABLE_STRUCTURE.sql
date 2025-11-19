-- ==============================================
-- VERIFY FACTORY_PRICING TABLE STRUCTURE
-- Run this to check if all columns exist correctly
-- ==============================================

-- Check all columns
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

-- Check if cost_per_case is generated correctly
SELECT 
    column_name,
    is_generated,
    generation_expression
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'factory_pricing'
  AND column_name = 'cost_per_case';

-- Test basic query
SELECT COUNT(*) as total_rows FROM public.factory_pricing;

-- Test query with all columns
SELECT * FROM public.factory_pricing LIMIT 1;

-- Test query with specific columns (as app uses)
SELECT 
    sku, 
    bottles_per_case
FROM public.factory_pricing
LIMIT 1;

