-- ==============================================
-- INSERT MISSING JULY 1, 2025 SALE TRANSACTION
-- ==============================================
-- This script adds the missing sale transaction from the image
-- Date: 7/1/2025, SKU: 500 P, Amount: ₹9,200, Quantity: 46 cases
-- ==============================================
-- WARNING: Review carefully before running!
-- This will add a new transaction and affect outstanding calculations
-- ==============================================

-- Step 1: Verify Alley 91 Customer ID
-- ==============================================
SELECT 
    id,
    client_name,
    branch,
    is_active
FROM customers
WHERE LOWER(client_name) LIKE '%alley%91%' 
   OR LOWER(client_name) = 'alley 91'
ORDER BY client_name;

-- Step 2: Check current outstanding before insertion
-- ==============================================
WITH alley91_customer AS (
    SELECT id 
    FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%' 
       OR LOWER(client_name) = 'alley 91'
    LIMIT 1
)
SELECT 
    'BEFORE INSERTION' as status,
    COUNT(*) as total_transactions,
    SUM(CASE WHEN transaction_type = 'sale' THEN amount ELSE 0 END) as total_sales,
    SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END) as total_payments,
    SUM(CASE WHEN transaction_type = 'sale' THEN amount ELSE 0 END) - 
    SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END) as net_outstanding
FROM sales_transactions
WHERE customer_id IN (SELECT id FROM alley91_customer);

-- Step 3: Insert the missing July 1, 2025 sale transaction
-- ==============================================
-- UNCOMMENT AND RUN THIS AFTER VERIFYING THE CUSTOMER ID ABOVE
/*
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
    -- Prevent duplicate insertion
    SELECT 1 FROM sales_transactions st
    INNER JOIN customers c ON st.customer_id = c.id
    WHERE (LOWER(c.client_name) LIKE '%alley%91%' OR LOWER(c.client_name) = 'alley 91')
      AND st.transaction_date = '2025-07-01'
      AND st.transaction_type = 'sale'
      AND st.amount = 9200.00
      AND st.quantity = 46
      AND st.sku = '500 P'
);
*/

-- Step 4: Verify insertion and recalculate outstanding
-- ==============================================
-- Run this AFTER inserting the transaction
WITH alley91_customer AS (
    SELECT id 
    FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%' 
       OR LOWER(client_name) = 'alley 91'
    LIMIT 1
)
SELECT 
    'AFTER INSERTION' as status,
    COUNT(*) as total_transactions,
    SUM(CASE WHEN transaction_type = 'sale' THEN amount ELSE 0 END) as total_sales,
    SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END) as total_payments,
    SUM(CASE WHEN transaction_type = 'sale' THEN amount ELSE 0 END) - 
    SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END) as net_outstanding
FROM sales_transactions
WHERE customer_id IN (SELECT id FROM alley91_customer);

-- Step 5: View chronological transactions with calculated outstanding
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

-- Step 6: Verify the July 1 transaction was inserted correctly
-- ==============================================
WITH alley91_customer AS (
    SELECT id 
    FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%' 
       OR LOWER(client_name) = 'alley 91'
    LIMIT 1
)
SELECT 
    st.id,
    st.transaction_date,
    st.transaction_type,
    st.amount,
    st.quantity,
    st.sku,
    st.description,
    st.branch,
    st.created_at,
    c.client_name
FROM sales_transactions st
INNER JOIN customers c ON st.customer_id = c.id
WHERE st.customer_id IN (SELECT id FROM alley91_customer)
  AND st.transaction_date = '2025-07-01'
  AND st.transaction_type = 'sale'
  AND st.sku = '500 P'
ORDER BY st.created_at ASC;
