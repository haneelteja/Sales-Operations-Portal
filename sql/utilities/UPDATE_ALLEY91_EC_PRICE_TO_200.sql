-- ==============================================
-- UPDATE ALLEY 91 - 250 EC PRICE TO ₹200 PER CASE
-- ==============================================
-- Update only Alley 91's 250 EC price to ₹200 per case
-- ==============================================

-- Step 1: Check current price before update
-- ==============================================
SELECT 
    id,
    client_name,
    branch,
    sku,
    price_per_case,
    updated_at
FROM customers
WHERE LOWER(client_name) LIKE '%alley%91%' 
  AND sku = '250 EC'
ORDER BY client_name, branch;

-- Step 2: Update Alley 91 - 250 EC price to ₹200
-- ==============================================
UPDATE customers
SET 
    price_per_case = 200.00,
    updated_at = NOW()
WHERE LOWER(client_name) LIKE '%alley%91%' 
  AND sku = '250 EC'
  AND (price_per_case IS NULL OR price_per_case != 200.00);

-- Step 3: Verify the update
-- ==============================================
SELECT 
    id,
    client_name,
    branch,
    sku,
    price_per_case,
    updated_at,
    CASE 
        WHEN price_per_case = 200.00 THEN '✓ Updated Successfully'
        ELSE '✗ Update Failed'
    END as status
FROM customers
WHERE LOWER(client_name) LIKE '%alley%91%' 
  AND sku = '250 EC';
