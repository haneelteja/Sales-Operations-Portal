-- ==============================================
-- CHECK FOR DUPLICATE CUSTOMERS
-- This will help identify why updates are failing
-- ==============================================

-- Step 1: Check for duplicate client_name + branch combinations
SELECT 
    client_name,
    branch,
    COUNT(*) as count,
    array_agg(id ORDER BY created_at) as customer_ids,
    array_agg(sku ORDER BY created_at) as skus
FROM public.customers
GROUP BY client_name, branch
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Step 2: Check specifically for "Element E7" + "Kukatpally"
SELECT 
    id,
    client_name,
    branch,
    sku,
    price_per_case,
    price_per_bottle,
    pricing_date,
    created_at
FROM public.customers
WHERE client_name = 'Element E7'
  AND branch = 'Kukatpally'
ORDER BY created_at;

-- Step 3: Check unique constraints
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.customers'::regclass
  AND contype = 'u';

-- Step 4: Test what happens if we try to update to existing values
-- This simulates what the app is trying to do
SELECT 
    COUNT(*) as would_violate_constraint
FROM public.customers
WHERE client_name = 'Element E7'
  AND branch = 'Kukatpally'
  AND id != '50021415-de43-41bb-ac95-933b80f1cdb4';

