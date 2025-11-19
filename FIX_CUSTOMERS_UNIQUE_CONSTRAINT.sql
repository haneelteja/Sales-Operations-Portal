-- ==============================================
-- FIX CUSTOMERS UNIQUE CONSTRAINT ISSUE
-- Check and potentially modify the unique constraint
-- ==============================================

-- Step 1: Check current unique constraints
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.customers'::regclass
  AND contype = 'u';

-- Step 2: Check for duplicate client_name + branch combinations
SELECT 
    client_name,
    branch,
    COUNT(*) as count,
    array_agg(id) as ids
FROM public.customers
GROUP BY client_name, branch
HAVING COUNT(*) > 1;

-- Step 3: Option A - Drop the unique constraint if it exists
-- (Only if you want to allow duplicates)
-- ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_client_name_branch_key;
-- ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_client_name_branch_unique;

-- Step 4: Option B - Keep unique constraint but make it more flexible
-- Check if constraint exists and what it's called
SELECT 
    conname,
    pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.customers'::regclass
  AND contype = 'u'
  AND pg_get_constraintdef(oid) LIKE '%client_name%'
  AND pg_get_constraintdef(oid) LIKE '%branch%';

-- Step 5: If you want to allow multiple customers with same client_name + branch
-- but different SKUs, you could modify the constraint to include SKU:
-- First drop old constraint
-- ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_client_name_branch_key;
-- Then create new constraint that includes SKU
-- ALTER TABLE public.customers ADD CONSTRAINT customers_client_branch_sku_unique 
--   UNIQUE (client_name, branch, sku);

-- Step 6: Check the specific record that's failing
SELECT * 
FROM public.customers 
WHERE id = '50021415-de43-41bb-ac95-933b80f1cdb4';

-- Step 7: Check if there's another record with same client_name + branch
SELECT * 
FROM public.customers 
WHERE client_name = (
    SELECT client_name FROM public.customers WHERE id = '50021415-de43-41bb-ac95-933b80f1cdb4'
)
AND branch = (
    SELECT branch FROM public.customers WHERE id = '50021415-de43-41bb-ac95-933b80f1cdb4'
)
AND id != '50021415-de43-41bb-ac95-933b80f1cdb4';

