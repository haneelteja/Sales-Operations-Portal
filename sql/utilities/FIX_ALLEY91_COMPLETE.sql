-- ==============================================
-- COMPLETE FIX FOR ALLEY 91 OUTSTANDING BALANCE
-- ==============================================
-- Expected Outstanding: ₹31,160 (positive)
-- Current Outstanding: -₹48,432.85 (negative)
-- Missing Sales Amount: ₹79,592.85
-- ==============================================

-- Step 1: Current State Analysis
-- ==============================================
WITH alley91_customer AS (
    SELECT id 
    FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%' 
       OR LOWER(client_name) = 'alley 91'
    LIMIT 1
)
SELECT 
    'ANALYSIS' as step,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN transaction_type = 'sale' THEN 1 END) as sales_count,
    COUNT(CASE WHEN transaction_type = 'payment' THEN 1 END) as payments_count,
    SUM(CASE WHEN transaction_type = 'sale' THEN amount ELSE 0 END) as total_sales,
    SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END) as total_payments,
    SUM(CASE WHEN transaction_type = 'sale' THEN amount ELSE 0 END) - 
    SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END) as current_outstanding,
    31160.00 as expected_outstanding,
    (31160.00 - (SUM(CASE WHEN transaction_type = 'sale' THEN amount ELSE 0 END) - 
     SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END))) as missing_sales_amount
FROM sales_transactions
WHERE customer_id IN (SELECT id FROM alley91_customer);

-- Step 2: Insert Missing July 1, 2025 Sale (₹9,200)
-- ==============================================
INSERT INTO sales_transactions (
    customer_id,
    transaction_date,
    transaction_type,
    amount,
    total_amount,
    quantity,
    sku,
    description,
    branch,
    created_at,
    updated_at
)
SELECT 
    (SELECT id FROM customers WHERE LOWER(client_name) LIKE '%alley%91%' OR LOWER(client_name) = 'alley 91' LIMIT 1) as customer_id,
    '2025-07-01'::DATE as transaction_date,
    'sale' as transaction_type,
    9200.00 as amount,
    9200.00 as total_amount,
    46 as quantity,
    '500 P' as sku,
    'Sale of 46.00 cases' as description,
    'Nanakram' as branch,
    NOW() as created_at,
    NOW() as updated_at
WHERE NOT EXISTS (
    SELECT 1 FROM sales_transactions st
    INNER JOIN customers c ON st.customer_id = c.id
    WHERE (LOWER(c.client_name) LIKE '%alley%91%' OR LOWER(c.client_name) = 'alley 91')
      AND st.transaction_date = '2025-07-01'::DATE
      AND st.transaction_type = 'sale'
      AND st.amount = 9200.00
      AND st.quantity = 46
      AND st.sku = '500 P'
);

-- Step 3: Verify After July Insertion
-- ==============================================
WITH alley91_customer AS (
    SELECT id 
    FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%' 
       OR LOWER(client_name) = 'alley 91'
    LIMIT 1
)
SELECT 
    'AFTER JULY INSERT' as step,
    COUNT(*) as total_transactions,
    SUM(CASE WHEN transaction_type = 'sale' THEN amount ELSE 0 END) as total_sales,
    SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END) as total_payments,
    SUM(CASE WHEN transaction_type = 'sale' THEN amount ELSE 0 END) - 
    SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END) as current_outstanding,
    31160.00 as expected_outstanding,
    (31160.00 - (SUM(CASE WHEN transaction_type = 'sale' THEN amount ELSE 0 END) - 
     SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END))) as still_missing_amount
FROM sales_transactions
WHERE customer_id IN (SELECT id FROM alley91_customer);

-- Step 4: View All Transactions Chronologically with Outstanding
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

-- ==============================================
-- NOTE: After inserting July transaction, you still need ₹70,392.85 more in sales
-- to reach the expected outstanding of ₹31,160.
-- 
-- This suggests there are other missing sales transactions that need to be added.
-- Please check your source documents/records to identify these missing transactions.
-- ==============================================
