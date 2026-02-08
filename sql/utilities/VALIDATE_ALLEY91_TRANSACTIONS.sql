-- ==============================================
-- VALIDATE AND FIX ALLEY 91 TRANSACTIONS
-- ==============================================
-- This script identifies inconsistencies in Alley 91 transactions
-- Run this in Supabase SQL Editor (Table View Analysis)
-- ==============================================

-- Step 1: Find Alley 91 Customer ID
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

-- Step 2: Get All Transactions for Alley 91 (Chronological Order)
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
    st.updated_at,
    c.client_name,
    c.branch as customer_branch,
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
    ) as calculated_outstanding
FROM sales_transactions st
INNER JOIN customers c ON st.customer_id = c.id
WHERE st.customer_id IN (SELECT id FROM alley91_customer)
ORDER BY st.transaction_date ASC, st.created_at ASC;

-- Step 3: Identify Inconsistencies
-- ==============================================
WITH alley91_customer AS (
    SELECT id 
    FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%' 
       OR LOWER(client_name) = 'alley 91'
    LIMIT 1
),
chronological_transactions AS (
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
        ROW_NUMBER() OVER (
            PARTITION BY st.customer_id 
            ORDER BY st.transaction_date ASC, st.created_at ASC
        ) as transaction_sequence,
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
        ) as calculated_outstanding
    FROM sales_transactions st
    WHERE st.customer_id IN (SELECT id FROM alley91_customer)
)
SELECT 
    'INCONSISTENCY TYPE' as issue_type,
    id,
    transaction_date,
    transaction_type,
    amount,
    sku,
    description,
    transaction_sequence,
    calculated_outstanding,
    CASE
        -- Missing amount
        WHEN amount IS NULL OR amount = 0 THEN 'Missing or zero amount'
        -- Missing transaction date
        WHEN transaction_date IS NULL THEN 'Missing transaction date'
        -- Missing transaction type
        WHEN transaction_type IS NULL OR transaction_type NOT IN ('sale', 'payment') THEN 'Invalid transaction type'
        -- Missing SKU for sales
        WHEN transaction_type = 'sale' AND (sku IS NULL OR sku = '') THEN 'Missing SKU for sale'
        -- Missing quantity for sales
        WHEN transaction_type = 'sale' AND (quantity IS NULL OR quantity = 0) THEN 'Missing quantity for sale'
        -- Negative amounts (should be positive, type indicates direction)
        WHEN amount < 0 THEN 'Negative amount (should be positive)'
        ELSE 'OK'
    END as issue_description
FROM chronological_transactions
WHERE 
    -- Missing amount
    amount IS NULL OR amount = 0
    -- Missing transaction date
    OR transaction_date IS NULL
    -- Missing transaction type
    OR transaction_type IS NULL OR transaction_type NOT IN ('sale', 'payment')
    -- Missing SKU for sales
    OR (transaction_type = 'sale' AND (sku IS NULL OR sku = ''))
    -- Missing quantity for sales
    OR (transaction_type = 'sale' AND (quantity IS NULL OR quantity = 0))
    -- Negative amounts
    OR amount < 0
ORDER BY transaction_date ASC, created_at ASC;

-- Step 4: Check for Duplicate Transactions
-- ==============================================
WITH alley91_customer AS (
    SELECT id 
    FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%' 
       OR LOWER(client_name) = 'alley 91'
    LIMIT 1
)
SELECT 
    transaction_date,
    transaction_type,
    amount,
    sku,
    quantity,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as transaction_ids
FROM sales_transactions
WHERE customer_id IN (SELECT id FROM alley91_customer)
GROUP BY transaction_date, transaction_type, amount, sku, quantity
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, transaction_date DESC;

-- Step 5: Check Date Ordering Issues
-- ==============================================
WITH alley91_customer AS (
    SELECT id 
    FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%' 
       OR LOWER(client_name) = 'alley 91'
    LIMIT 1
),
ordered_transactions AS (
    SELECT 
        id,
        transaction_date,
        created_at,
        transaction_type,
        amount,
        ROW_NUMBER() OVER (ORDER BY transaction_date ASC, created_at ASC) as chronological_order,
        LAG(transaction_date) OVER (ORDER BY transaction_date ASC, created_at ASC) as previous_date,
        LAG(created_at) OVER (ORDER BY transaction_date ASC, created_at ASC) as previous_created_at
    FROM sales_transactions
    WHERE customer_id IN (SELECT id FROM alley91_customer)
)
SELECT 
    'Date Ordering Issue' as issue_type,
    id,
    transaction_date,
    created_at,
    previous_date,
    previous_created_at,
    transaction_type,
    amount,
    CASE
        WHEN previous_date IS NOT NULL AND transaction_date < previous_date THEN 
            'Transaction date is earlier than previous transaction'
        WHEN previous_date IS NOT NULL AND transaction_date = previous_date AND created_at < previous_created_at THEN 
            'Same date but created_at is earlier (should be sorted by created_at)'
        ELSE 'OK'
    END as issue_description
FROM ordered_transactions
WHERE 
    (previous_date IS NOT NULL AND transaction_date < previous_date)
    OR (previous_date IS NOT NULL AND transaction_date = previous_date AND created_at < previous_created_at)
ORDER BY transaction_date ASC, created_at ASC;

-- Step 6: Summary Report
-- ==============================================
WITH alley91_customer AS (
    SELECT id 
    FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%' 
       OR LOWER(client_name) = 'alley 91'
    LIMIT 1
)
SELECT 
    'SUMMARY' as report_section,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN transaction_type = 'sale' THEN 1 END) as total_sales,
    COUNT(CASE WHEN transaction_type = 'payment' THEN 1 END) as total_payments,
    SUM(CASE WHEN transaction_type = 'sale' THEN amount ELSE 0 END) as total_sales_amount,
    SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END) as total_payments_amount,
    SUM(CASE WHEN transaction_type = 'sale' THEN amount ELSE 0 END) - 
    SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END) as net_outstanding,
    COUNT(CASE WHEN amount IS NULL OR amount = 0 THEN 1 END) as missing_amounts,
    COUNT(CASE WHEN transaction_date IS NULL THEN 1 END) as missing_dates,
    COUNT(CASE WHEN transaction_type IS NULL OR transaction_type NOT IN ('sale', 'payment') THEN 1 END) as invalid_types,
    COUNT(CASE WHEN transaction_type = 'sale' AND (sku IS NULL OR sku = '') THEN 1 END) as missing_skus,
    COUNT(CASE WHEN transaction_type = 'sale' AND (quantity IS NULL OR quantity = 0) THEN 1 END) as missing_quantities
FROM sales_transactions
WHERE customer_id IN (SELECT id FROM alley91_customer);
