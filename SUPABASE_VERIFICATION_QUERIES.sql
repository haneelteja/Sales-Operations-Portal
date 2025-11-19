-- ==============================================
-- SUPABASE DATABASE VERIFICATION QUERIES
-- Run these queries in Supabase SQL Editor to verify the database structure
-- ==============================================

-- ==============================================
-- 1. CHECK TABLE STRUCTURE
-- ==============================================

-- Check if factory_pricing table exists and show its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'factory_pricing'
ORDER BY ordinal_position;

-- ==============================================
-- 2. CHECK ROW LEVEL SECURITY (RLS) STATUS
-- ==============================================

-- Check if RLS is enabled on factory_pricing table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'factory_pricing';

-- ==============================================
-- 3. CHECK RLS POLICIES
-- ==============================================

-- List all RLS policies on factory_pricing table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'factory_pricing';

-- ==============================================
-- 4. CHECK SAMPLE DATA
-- ==============================================

-- Count total records in factory_pricing
SELECT COUNT(*) as total_records FROM factory_pricing;

-- View first 10 records from factory_pricing
SELECT 
    id,
    sku,
    bottles_per_case,
    price_per_bottle,
    cost_per_case,
    pricing_date,
    tax,
    created_at,
    updated_at
FROM factory_pricing
ORDER BY pricing_date DESC, sku ASC
LIMIT 10;

-- Check for NULL or empty SKU values
SELECT 
    COUNT(*) as null_or_empty_sku_count
FROM factory_pricing
WHERE sku IS NULL OR TRIM(sku) = '';

-- Check unique SKUs
SELECT 
    sku,
    COUNT(*) as count,
    MIN(pricing_date) as earliest_date,
    MAX(pricing_date) as latest_date
FROM factory_pricing
GROUP BY sku
ORDER BY sku;

-- ==============================================
-- 5. CHECK COLUMN CONSTRAINTS AND INDEXES
-- ==============================================

-- Check constraints on factory_pricing table
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.factory_pricing'::regclass;

-- Check indexes on factory_pricing table
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'factory_pricing';

-- ==============================================
-- 6. TEST QUERY (Same as application uses)
-- ==============================================

-- Test the exact query used in the application
SELECT 
    sku, 
    bottles_per_case
FROM factory_pricing
ORDER BY sku ASC;

-- Test query for unique SKUs
SELECT DISTINCT sku
FROM factory_pricing
ORDER BY sku ASC;

-- ==============================================
-- 7. CHECK CUSTOMERS TABLE (Related table)
-- ==============================================

-- Check customers table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'customers'
ORDER BY ordinal_position;

-- Check if customers table has pricing_date column
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'customers'
  AND column_name = 'pricing_date';

-- ==============================================
-- 8. CHECK PERMISSIONS
-- ==============================================

-- Check table permissions for anon role
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'factory_pricing'
  AND grantee IN ('anon', 'authenticated', 'public');

-- ==============================================
-- 9. CHECK FOR GENERATED COLUMNS
-- ==============================================

-- Check if cost_per_case is a generated column
SELECT 
    column_name,
    data_type,
    is_generated,
    generation_expression
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'factory_pricing'
  AND column_name = 'cost_per_case';

-- ==============================================
-- 10. VERIFY DATA TYPES MATCH APPLICATION EXPECTATIONS
-- ==============================================

-- Check data types match expected types
SELECT 
    column_name,
    data_type,
    CASE 
        WHEN column_name = 'id' AND data_type = 'uuid' THEN '✓'
        WHEN column_name = 'sku' AND data_type = 'text' THEN '✓'
        WHEN column_name = 'bottles_per_case' AND data_type IN ('integer', 'smallint', 'bigint') THEN '✓'
        WHEN column_name = 'price_per_bottle' AND data_type IN ('numeric', 'double precision', 'real') THEN '✓'
        WHEN column_name = 'cost_per_case' AND data_type IN ('numeric', 'double precision', 'real') THEN '✓'
        WHEN column_name = 'pricing_date' AND data_type = 'date' THEN '✓'
        WHEN column_name = 'tax' AND data_type IN ('numeric', 'double precision', 'real') THEN '✓'
        ELSE '✗'
    END as type_check
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'factory_pricing'
ORDER BY ordinal_position;

-- ==============================================
-- END OF VERIFICATION QUERIES
-- ==============================================

