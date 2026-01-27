-- ==============================================
-- FIND MISSING JULY 1, 2025 TRANSACTION
-- ==============================================
-- This query searches for the transaction mentioned in the image
-- Date: 7/1/2025, SKU: 500 P, Amount: 9200, Quantity: 46
-- ==============================================

-- Step 1: Search for transaction on July 1, 2025
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
  AND (
    -- Search by date (July 1, 2025)
    st.transaction_date = '2025-07-01'
    -- Search by SKU
    OR st.sku = '500 P'
    -- Search by amount and quantity combination
    OR (st.amount = 9200 AND st.quantity = 46)
  )
ORDER BY st.transaction_date ASC, st.created_at ASC;

-- Step 2: Search for all transactions with SKU "500 P"
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
    st.created_at
FROM sales_transactions st
WHERE st.customer_id IN (SELECT id FROM alley91_customer)
  AND st.sku = '500 P'
ORDER BY st.transaction_date ASC, st.created_at ASC;

-- Step 3: Search for transactions around July 2025
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
    st.created_at
FROM sales_transactions st
WHERE st.customer_id IN (SELECT id FROM alley91_customer)
  AND st.transaction_date >= '2025-07-01'
  AND st.transaction_date <= '2025-07-31'
ORDER BY st.transaction_date ASC, st.created_at ASC;

-- Step 4: Check if transaction was deleted (check all transactions with amount 9200)
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
    st.updated_at
FROM sales_transactions st
WHERE st.customer_id IN (SELECT id FROM alley91_customer)
  AND st.amount = 9200
ORDER BY st.transaction_date ASC, st.created_at ASC;
