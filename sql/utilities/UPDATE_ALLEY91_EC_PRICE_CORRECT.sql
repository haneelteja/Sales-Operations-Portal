-- ==============================================
-- UPDATE ALLEY 91 - 250 EC PRICE TO ₹200 PER CASE
-- ==============================================
-- Since price_per_case is a GENERATED column, we need to update price_per_bottle instead
-- Formula: price_per_case = price_per_bottle * bottles_per_case
-- For 250 EC: bottles_per_case = 35 (typically)
-- To get price_per_case = 200: price_per_bottle = 200 / 35 = 5.7142857...
-- ==============================================

-- Step 1: Check current values and calculate required price_per_bottle
-- ==============================================
SELECT 
    c.id,
    c.client_name,
    c.branch,
    c.sku,
    c.price_per_bottle,
    c.price_per_case,
    sc.bottles_per_case,
    CASE 
        WHEN sc.bottles_per_case > 0 THEN 200.00 / sc.bottles_per_case
        ELSE NULL
    END as required_price_per_bottle
FROM customers c
LEFT JOIN sku_configurations sc ON c.sku = sc.sku
WHERE LOWER(c.client_name) = 'alley 91'
  AND c.sku = '250 EC';

-- Step 2: Update price_per_bottle (price_per_case will auto-calculate)
-- ==============================================
-- First, get bottles_per_case for 250 EC
WITH ec_config AS (
    SELECT bottles_per_case 
    FROM sku_configurations 
    WHERE sku = '250 EC'
    LIMIT 1
)
UPDATE customers
SET 
    price_per_bottle = (
        SELECT 200.00 / NULLIF(bottles_per_case, 0) 
        FROM ec_config
    ),
    updated_at = NOW()
WHERE LOWER(client_name) = 'alley 91'
  AND sku = '250 EC'
  AND EXISTS (SELECT 1 FROM ec_config);

-- Alternative: If bottles_per_case is 35 for 250 EC, use direct calculation
-- UPDATE customers
-- SET 
--     price_per_bottle = 200.00 / 35.0,  -- = 5.7142857...
--     updated_at = NOW()
-- WHERE LOWER(client_name) = 'alley 91'
--   AND sku = '250 EC';

-- Step 3: Verify the update
-- ==============================================
SELECT 
    c.client_name,
    c.branch,
    c.sku,
    c.price_per_bottle,
    c.price_per_case,
    sc.bottles_per_case,
    CASE 
        WHEN ABS(c.price_per_case - 200.00) < 0.01 THEN '✓ Updated Successfully'
        ELSE '✗ Check calculation'
    END as status
FROM customers c
LEFT JOIN sku_configurations sc ON c.sku = sc.sku
WHERE LOWER(c.client_name) = 'alley 91'
  AND c.sku = '250 EC';
