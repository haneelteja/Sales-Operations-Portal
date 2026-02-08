-- ==============================================
-- UPDATE EC SKU PRICE TO ₹200 PER CASE
-- ==============================================
-- Update price for EC (250 EC) SKU to ₹200 per case
-- ==============================================

-- Step 1: Check current EC price configuration
-- ==============================================
-- Check if price is stored in customers table
SELECT 
    id,
    client_name,
    branch,
    sku,
    price_per_case
FROM customers
WHERE sku LIKE '%EC%' OR sku = '250 EC'
ORDER BY client_name, branch, sku;

-- Step 2: Update EC price in customers table (if price_per_case column exists)
-- ==============================================
-- Update all customers with EC SKU to ₹200 per case
UPDATE customers
SET 
    price_per_case = 200.00,
    updated_at = NOW()
WHERE (sku LIKE '%EC%' OR sku = '250 EC')
  AND (price_per_case IS NULL OR price_per_case != 200.00);

-- Step 3: Check if sku_configurations table exists and update there
-- ==============================================
-- Update price in sku_configurations table if it exists
UPDATE sku_configurations
SET 
    price_per_case = 200.00,
    updated_at = NOW()
WHERE sku LIKE '%EC%' OR sku = '250 EC';

-- Step 4: Verify the update
-- ==============================================
SELECT 
    'CUSTOMERS TABLE' as source,
    COUNT(*) as total_records,
    COUNT(CASE WHEN price_per_case = 200.00 THEN 1 END) as updated_to_200,
    COUNT(CASE WHEN price_per_case != 200.00 OR price_per_case IS NULL THEN 1 END) as still_needs_update
FROM customers
WHERE sku LIKE '%EC%' OR sku = '250 EC';

SELECT 
    'SKU_CONFIGURATIONS TABLE' as source,
    COUNT(*) as total_records,
    COUNT(CASE WHEN price_per_case = 200.00 THEN 1 END) as updated_to_200,
    COUNT(CASE WHEN price_per_case != 200.00 OR price_per_case IS NULL THEN 1 END) as still_needs_update
FROM sku_configurations
WHERE sku LIKE '%EC%' OR sku = '250 EC';
