-- ==============================================
-- CHECK FOREIGN KEY CONSTRAINTS ON CUSTOMERS
-- This will identify why DELETE is failing
-- ==============================================

-- Step 1: Check all foreign key constraints that reference customers table
SELECT
    tc.table_name as referencing_table,
    kcu.column_name as referencing_column,
    ccu.table_name as referenced_table,
    ccu.column_name as referenced_column,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'customers';

-- Step 2: Check if sales_transactions references this customer
SELECT COUNT(*) as sales_transactions_count
FROM public.sales_transactions
WHERE customer_id = '50021415-de43-41bb-ac95-933b80f1cdb4';

-- Step 3: Check if factory_payables references this customer
SELECT COUNT(*) as factory_payables_count
FROM public.factory_payables
WHERE customer_id = '50021415-de43-41bb-ac95-933b80f1cdb4';

-- Step 4: Check if any other tables reference this customer
-- (Check common foreign key column names)
SELECT 
    'sales_transactions' as table_name,
    COUNT(*) as reference_count
FROM public.sales_transactions
WHERE customer_id = '50021415-de43-41bb-ac95-933b80f1cdb4'
UNION ALL
SELECT 
    'factory_payables' as table_name,
    COUNT(*) as reference_count
FROM public.factory_payables
WHERE customer_id = '50021415-de43-41bb-ac95-933b80f1cdb4'
UNION ALL
SELECT 
    'orders' as table_name,
    COUNT(*) as reference_count
FROM public.orders
WHERE customer_id = '50021415-de43-41bb-ac95-933b80f1cdb4';

-- Step 5: Check what records are referencing this customer
SELECT 
    'sales_transactions' as table_name,
    id,
    transaction_date,
    amount
FROM public.sales_transactions
WHERE customer_id = '50021415-de43-41bb-ac95-933b80f1cdb4'
LIMIT 5;

