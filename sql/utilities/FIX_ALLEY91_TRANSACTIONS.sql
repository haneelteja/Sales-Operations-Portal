-- ==============================================
-- FIX ALLEY 91 TRANSACTION INCONSISTENCIES
-- ==============================================
-- WARNING: Review the VALIDATE_ALLEY91_TRANSACTIONS.sql results first!
-- Run this script AFTER reviewing validation results
-- ==============================================

-- Step 1: Get Alley 91 Customer ID (for reference)
-- ==============================================
DO $$
DECLARE
    alley91_customer_id UUID;
BEGIN
    SELECT id INTO alley91_customer_id
    FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%' 
       OR LOWER(client_name) = 'alley 91'
    LIMIT 1;
    
    IF alley91_customer_id IS NULL THEN
        RAISE EXCEPTION 'Alley 91 customer not found';
    END IF;
    
    RAISE NOTICE 'Alley 91 Customer ID: %', alley91_customer_id;
END $$;

-- Step 2: Fix Missing or Zero Amounts
-- ==============================================
-- This will set a default amount for transactions with missing/zero amounts
-- REVIEW CAREFULLY BEFORE RUNNING - you may need to manually set correct amounts
UPDATE sales_transactions st
SET 
    amount = CASE
        -- For sales with missing amount, try to calculate from quantity and SKU pricing
        WHEN st.transaction_type = 'sale' AND (st.amount IS NULL OR st.amount = 0) THEN
            COALESCE(
                (SELECT price_per_case FROM customers c 
                 WHERE c.id = st.customer_id AND c.sku = st.sku LIMIT 1) * COALESCE(st.quantity, 0),
                st.total_amount,  -- Fallback to total_amount if available
                0  -- Last resort: set to 0 (REVIEW MANUALLY)
            )
        -- For payments with missing amount, keep as 0 (REVIEW MANUALLY)
        WHEN st.transaction_type = 'payment' AND (st.amount IS NULL OR st.amount = 0) THEN 0
        ELSE st.amount
    END,
    updated_at = NOW()
WHERE st.customer_id IN (
    SELECT id FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%' 
       OR LOWER(client_name) = 'alley 91'
)
AND (st.amount IS NULL OR st.amount = 0);

-- Step 3: Fix Negative Amounts (convert to positive)
-- ==============================================
-- Amounts should always be positive, transaction_type indicates direction
UPDATE sales_transactions st
SET 
    amount = ABS(amount),
    updated_at = NOW()
WHERE st.customer_id IN (
    SELECT id FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%' 
       OR LOWER(client_name) = 'alley 91'
)
AND st.amount < 0;

-- Step 4: Fix Missing Transaction Dates
-- ==============================================
-- Set missing dates to created_at date (or current date if created_at is also missing)
UPDATE sales_transactions st
SET 
    transaction_date = COALESCE(
        DATE(st.transaction_date),
        DATE(st.created_at),
        CURRENT_DATE
    ),
    updated_at = NOW()
WHERE st.customer_id IN (
    SELECT id FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%' 
       OR LOWER(client_name) = 'alley 91'
)
AND st.transaction_date IS NULL;

-- Step 5: Fix Invalid Transaction Types
-- ==============================================
-- Set default transaction type based on description or amount
UPDATE sales_transactions st
SET 
    transaction_type = CASE
        WHEN LOWER(COALESCE(st.description, '')) LIKE '%payment%' 
          OR LOWER(COALESCE(st.description, '')) LIKE '%paid%' THEN 'payment'
        WHEN LOWER(COALESCE(st.description, '')) LIKE '%sale%' 
          OR LOWER(COALESCE(st.description, '')) LIKE '%sold%' THEN 'sale'
        WHEN st.sku IS NOT NULL AND st.quantity > 0 THEN 'sale'
        ELSE 'sale'  -- Default to sale (REVIEW MANUALLY)
    END,
    updated_at = NOW()
WHERE st.customer_id IN (
    SELECT id FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%' 
       OR LOWER(client_name) = 'alley 91'
)
AND (st.transaction_type IS NULL OR st.transaction_type NOT IN ('sale', 'payment'));

-- Step 6: Fix Missing SKUs for Sales
-- ==============================================
-- Try to infer SKU from other transactions or set default
UPDATE sales_transactions st
SET 
    sku = COALESCE(
        st.sku,
        -- Try to get most common SKU for this customer-branch combination
        (SELECT sku FROM sales_transactions st2 
         WHERE st2.customer_id = st.customer_id 
           AND st2.branch = st.branch 
           AND st2.sku IS NOT NULL 
           AND st2.sku != ''
         GROUP BY sku 
         ORDER BY COUNT(*) DESC 
         LIMIT 1),
        'UNKNOWN'  -- Last resort: set to UNKNOWN (REVIEW MANUALLY)
    ),
    updated_at = NOW()
WHERE st.customer_id IN (
    SELECT id FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%' 
       OR LOWER(client_name) = 'alley 91'
)
AND st.transaction_type = 'sale'
AND (st.sku IS NULL OR st.sku = '');

-- Step 7: Fix Missing Quantities for Sales
-- ==============================================
-- Try to calculate quantity from amount and price, or set default
UPDATE sales_transactions st
SET 
    quantity = COALESCE(
        st.quantity,
        -- Try to calculate from amount and price_per_case
        CASE 
            WHEN st.amount > 0 AND EXISTS (
                SELECT 1 FROM customers c 
                WHERE c.id = st.customer_id 
                  AND c.sku = st.sku 
                  AND c.price_per_case > 0
            ) THEN
                ROUND(st.amount / (
                    SELECT price_per_case FROM customers c 
                    WHERE c.id = st.customer_id 
                      AND c.sku = st.sku 
                    LIMIT 1
                ))
            ELSE 1  -- Default to 1 case (REVIEW MANUALLY)
        END
    ),
    updated_at = NOW()
WHERE st.customer_id IN (
    SELECT id FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%' 
       OR LOWER(client_name) = 'alley 91'
)
AND st.transaction_type = 'sale'
AND (st.quantity IS NULL OR st.quantity = 0);

-- Step 8: Ensure Total Amount Matches Amount
-- ==============================================
UPDATE sales_transactions st
SET 
    total_amount = st.amount,
    updated_at = NOW()
WHERE st.customer_id IN (
    SELECT id FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%' 
       OR LOWER(client_name) = 'alley 91'
)
AND (st.total_amount IS NULL OR st.total_amount != st.amount);

-- Step 9: Verify Fixes
-- ==============================================
-- Run this to verify all fixes were applied correctly
WITH alley91_customer AS (
    SELECT id 
    FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%' 
       OR LOWER(client_name) = 'alley 91'
    LIMIT 1
)
SELECT 
    'VERIFICATION' as check_type,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN amount IS NULL OR amount = 0 THEN 1 END) as still_missing_amounts,
    COUNT(CASE WHEN transaction_date IS NULL THEN 1 END) as still_missing_dates,
    COUNT(CASE WHEN transaction_type IS NULL OR transaction_type NOT IN ('sale', 'payment') THEN 1 END) as still_invalid_types,
    COUNT(CASE WHEN transaction_type = 'sale' AND (sku IS NULL OR sku = '') THEN 1 END) as still_missing_skus,
    COUNT(CASE WHEN transaction_type = 'sale' AND (quantity IS NULL OR quantity = 0) THEN 1 END) as still_missing_quantities,
    COUNT(CASE WHEN amount < 0 THEN 1 END) as still_negative_amounts,
    COUNT(CASE WHEN total_amount IS NULL OR total_amount != amount THEN 1 END) as total_amount_mismatches
FROM sales_transactions
WHERE customer_id IN (SELECT id FROM alley91_customer);

-- Step 10: Show Final Chronological View with Calculated Outstanding
-- ==============================================
WITH alley91_customer AS (
    SELECT id 
    FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%' 
       OR LOWER(client_name) = 'alley 91'
    LIMIT 1
)
SELECT 
    st.transaction_date,
    st.transaction_type,
    st.amount,
    st.quantity,
    st.sku,
    st.description,
    st.branch,
    -- Calculate cumulative outstanding chronologically
    SUM(
        CASE 
            WHEN st.transaction_type = 'sale' THEN st.amount
            WHEN st.transaction_type = 'payment' THEN -st.amount
            ELSE 0
        END
    ) OVER (
        PARTITION BY st.customer_id 
        ORDER BY st.transaction_date ASC, st.created_at ASC
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) as customer_outstanding,
    st.created_at
FROM sales_transactions st
WHERE st.customer_id IN (SELECT id FROM alley91_customer)
ORDER BY st.transaction_date ASC, st.created_at ASC;
