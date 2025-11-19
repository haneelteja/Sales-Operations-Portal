-- ==============================================
-- CHECK SALES_TRANSACTIONS TABLE STRUCTURE
-- Verify if total_amount column exists
-- ==============================================

-- Step 1: Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'sales_transactions'
ORDER BY ordinal_position;

-- Step 2: Check if total_amount column exists
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'sales_transactions'
  AND column_name = 'total_amount';

-- Step 3: Check constraints
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.sales_transactions'::regclass;

