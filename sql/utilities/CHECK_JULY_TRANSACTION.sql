-- ==============================================
-- CHECK IF JULY 1, 2025 TRANSACTION EXISTS
-- ==============================================
-- Verify if the July transaction was inserted correctly
-- ==============================================

-- Step 1: Check if July 1 transaction exists (any format)
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
    -- Check date format
    TO_CHAR(st.transaction_date, 'YYYY-MM-DD') as formatted_date,
    st.transaction_date::text as date_as_text
FROM sales_transactions st
WHERE st.customer_id IN (SELECT id FROM alley91_customer)
  AND (
    st.transaction_date = '2025-07-01'::DATE
    OR st.transaction_date::DATE = '2025-07-01'::DATE
    OR st.sku = '500 P'
    OR (st.amount = 9200.00 AND st.quantity = 46)
  )
ORDER BY st.transaction_date ASC, st.created_at ASC;

-- Step 2: Check all transactions in July 2025
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
    TO_CHAR(st.transaction_date, 'YYYY-MM-DD') as formatted_date
FROM sales_transactions st
WHERE st.customer_id IN (SELECT id FROM alley91_customer)
  AND st.transaction_date >= '2025-07-01'::DATE
  AND st.transaction_date <= '2025-07-31'::DATE
ORDER BY st.transaction_date ASC, st.created_at ASC;

-- Step 3: Check column data type
-- ==============================================
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'sales_transactions'
  AND column_name = 'transaction_date';

-- Step 4: Verify total outstanding calculation
-- ==============================================
WITH alley91_customer AS (
    SELECT id 
    FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%' 
       OR LOWER(client_name) = 'alley 91'
    LIMIT 1
)
SELECT 
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN transaction_type = 'sale' THEN 1 END) as total_sales_count,
    COUNT(CASE WHEN transaction_type = 'payment' THEN 1 END) as total_payments_count,
    SUM(CASE WHEN transaction_type = 'sale' THEN amount ELSE 0 END) as total_sales_amount,
    SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END) as total_payments_amount,
    SUM(CASE WHEN transaction_type = 'sale' THEN amount ELSE 0 END) - 
    SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END) as calculated_outstanding,
    31160.00 as expected_outstanding,
    (SUM(CASE WHEN transaction_type = 'sale' THEN amount ELSE 0 END) - 
     SUM(CASE WHEN transaction_type = 'payment' THEN amount ELSE 0 END)) - 31160.00 as difference
FROM sales_transactions
WHERE customer_id IN (SELECT id FROM alley91_customer);
