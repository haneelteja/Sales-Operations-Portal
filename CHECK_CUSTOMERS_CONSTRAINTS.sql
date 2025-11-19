-- ==============================================
-- CHECK CUSTOMERS TABLE CONSTRAINTS
-- This will help identify the 409 conflict error
-- ==============================================

-- Step 1: Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'customers'
ORDER BY ordinal_position;

-- Step 2: Check all constraints
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.customers'::regclass;

-- Step 3: Check unique constraints specifically
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.customers'::regclass
  AND contype = 'u';

-- Step 4: Check for duplicate client_name + branch combinations
SELECT 
    client_name,
    branch,
    COUNT(*) as count
FROM public.customers
GROUP BY client_name, branch
HAVING COUNT(*) > 1;

-- Step 5: Check the specific record that's failing
SELECT * 
FROM public.customers 
WHERE id = '50021415-de43-41bb-ac95-933b80f1cdb4';

