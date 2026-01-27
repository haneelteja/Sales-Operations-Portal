-- ==============================================
-- INSERT MISSING ALLEY 91 TRANSACTIONS
-- ==============================================
-- Transactions to insert:
-- 1. 7/1/2025: Quantity 46, Amount ₹9,200
-- 2. 8/15/2025: Quantity 25, Amount ₹5,000
-- ==============================================

-- Step 1: Insert July 1, 2025 Transaction
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
    '250 EC' as sku,
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
);

-- Step 2: Insert August 15, 2025 Transaction
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
    '2025-08-15'::DATE as transaction_date,
    'sale' as transaction_type,
    5000.00 as amount,
    5000.00 as total_amount,
    25 as quantity,
    '250 EC' as sku,
    'Sale of 25.00 cases' as description,
    'Nanakram' as branch,
    NOW() as created_at,
    NOW() as updated_at
WHERE NOT EXISTS (
    SELECT 1 FROM sales_transactions st
    INNER JOIN customers c ON st.customer_id = c.id
    WHERE (LOWER(c.client_name) LIKE '%alley%91%' OR LOWER(c.client_name) = 'alley 91')
      AND st.transaction_date = '2025-08-15'::DATE
      AND st.transaction_type = 'sale'
      AND st.amount = 5000.00
      AND st.quantity = 25
);

-- Step 3: Verify Insertions
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
    ) as customer_outstanding
FROM sales_transactions st
WHERE st.customer_id IN (SELECT id FROM alley91_customer)
  AND st.transaction_date IN ('2025-07-01'::DATE, '2025-08-15'::DATE)
ORDER BY st.transaction_date ASC, st.created_at ASC;
