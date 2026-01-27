-- ==============================================
-- INSERT BATCH ALLEY 91 TRANSACTIONS
-- ==============================================
-- Insert 8 transactions from the provided data
-- Includes duplicate prevention
-- ==============================================

-- Step 1: Verify Customer IDs
-- ==============================================
SELECT 
    id,
    client_name,
    branch,
    sku
FROM customers
WHERE LOWER(client_name) LIKE '%alley%91%'
ORDER BY client_name, branch, sku;

-- Step 2: Insert Transaction 1 - 7/1/2025: Alley 91, 500 P, 46 cases, ₹9,200
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
    (SELECT id FROM customers 
     WHERE LOWER(client_name) = 'alley 91' 
       AND sku = '500 P' 
     LIMIT 1) as customer_id,
    '2025-07-01'::DATE as transaction_date,
    'sale' as transaction_type,
    9200.00 as amount,
    9200.00 as total_amount,
    46 as quantity,
    '500 P' as sku,
    'Sale of 46.00 cases - 500 P' as description,
    COALESCE((SELECT branch FROM customers 
              WHERE LOWER(client_name) = 'alley 91' 
                AND sku = '500 P' 
              LIMIT 1), 'Nanakram') as branch,
    NOW() as created_at,
    NOW() as updated_at
WHERE NOT EXISTS (
    SELECT 1 FROM sales_transactions st
    INNER JOIN customers c ON st.customer_id = c.id
    WHERE LOWER(c.client_name) = 'alley 91'
      AND st.transaction_date = '2025-07-01'::DATE
      AND st.transaction_type = 'sale'
      AND st.amount = 9200.00
      AND st.quantity = 46
      AND st.sku = '500 P'
);

-- Step 3: Insert Transaction 2 - 8/15/2025: Alley 91, 500 P, 25 cases, ₹5,000
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
    (SELECT id FROM customers 
     WHERE LOWER(client_name) = 'alley 91' 
       AND sku = '500 P' 
     LIMIT 1) as customer_id,
    '2025-08-15'::DATE as transaction_date,
    'sale' as transaction_type,
    5000.00 as amount,
    5000.00 as total_amount,
    25 as quantity,
    '500 P' as sku,
    'Sale of 25.00 cases - 500 P' as description,
    COALESCE((SELECT branch FROM customers 
              WHERE LOWER(client_name) = 'alley 91' 
                AND sku = '500 P' 
              LIMIT 1), 'Nanakram') as branch,
    NOW() as created_at,
    NOW() as updated_at
WHERE NOT EXISTS (
    SELECT 1 FROM sales_transactions st
    INNER JOIN customers c ON st.customer_id = c.id
    WHERE LOWER(c.client_name) = 'alley 91'
      AND st.transaction_date = '2025-08-15'::DATE
      AND st.transaction_type = 'sale'
      AND st.amount = 5000.00
      AND st.quantity = 25
      AND st.sku = '500 P'
);

-- Step 4: Insert Transaction 3 - 8/25/2025: Alley 91, 500 P, 25 cases, ₹5,000
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
    (SELECT id FROM customers 
     WHERE LOWER(client_name) = 'alley 91' 
       AND sku = '500 P' 
     LIMIT 1) as customer_id,
    '2025-08-25'::DATE as transaction_date,
    'sale' as transaction_type,
    5000.00 as amount,
    5000.00 as total_amount,
    25 as quantity,
    '500 P' as sku,
    'Sale of 25.00 cases - 500 P' as description,
    COALESCE((SELECT branch FROM customers 
              WHERE LOWER(client_name) = 'alley 91' 
                AND sku = '500 P' 
              LIMIT 1), 'Nanakram') as branch,
    NOW() as created_at,
    NOW() as updated_at
WHERE NOT EXISTS (
    SELECT 1 FROM sales_transactions st
    INNER JOIN customers c ON st.customer_id = c.id
    WHERE LOWER(c.client_name) = 'alley 91'
      AND st.transaction_date = '2025-08-25'::DATE
      AND st.transaction_type = 'sale'
      AND st.amount = 5000.00
      AND st.quantity = 25
      AND st.sku = '500 P'
);

-- Step 5: Insert Transaction 4 - 8/31/2025: Alley 91, No SKU, 0 cases, ₹0
-- ==============================================
-- Note: This transaction has 0 amount and 0 cases. Inserting with NULL SKU.
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
    (SELECT id FROM customers 
     WHERE LOWER(client_name) = 'alley 91' 
     LIMIT 1) as customer_id,
    '2025-08-31'::DATE as transaction_date,
    'sale' as transaction_type,
    0.00 as amount,
    0.00 as total_amount,
    0 as quantity,
    NULL as sku,
    'Zero amount transaction' as description,
    COALESCE((SELECT branch FROM customers 
              WHERE LOWER(client_name) = 'alley 91' 
              LIMIT 1), 'Nanakram') as branch,
    NOW() as created_at,
    NOW() as updated_at
WHERE NOT EXISTS (
    SELECT 1 FROM sales_transactions st
    INNER JOIN customers c ON st.customer_id = c.id
    WHERE LOWER(c.client_name) = 'alley 91'
      AND st.transaction_date = '2025-08-31'::DATE
      AND st.transaction_type = 'sale'
      AND st.amount = 0.00
      AND st.quantity = 0
);

-- Step 6: Insert Transaction 5 - 9/23/2025: Alley 91, 500 P, 33 cases, ₹0
-- ==============================================
-- Note: This transaction has 0 amount but 33 cases. Inserting as sale.
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
    (SELECT id FROM customers 
     WHERE LOWER(client_name) = 'alley 91' 
       AND sku = '500 P' 
     LIMIT 1) as customer_id,
    '2025-09-23'::DATE as transaction_date,
    'sale' as transaction_type,
    0.00 as amount,
    0.00 as total_amount,
    33 as quantity,
    '500 P' as sku,
    'Sale of 33.00 cases - 500 P (zero amount)' as description,
    COALESCE((SELECT branch FROM customers 
              WHERE LOWER(client_name) = 'alley 91' 
                AND sku = '500 P' 
              LIMIT 1), 'Nanakram') as branch,
    NOW() as created_at,
    NOW() as updated_at
WHERE NOT EXISTS (
    SELECT 1 FROM sales_transactions st
    INNER JOIN customers c ON st.customer_id = c.id
    WHERE LOWER(c.client_name) = 'alley 91'
      AND st.transaction_date = '2025-09-23'::DATE
      AND st.transaction_type = 'sale'
      AND st.amount = 0.00
      AND st.quantity = 33
      AND st.sku = '500 P'
);

-- Step 7: Insert Transaction 6 - 12/4/2025: Alley 91, 500 P, 50 cases, ₹10,000
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
    (SELECT id FROM customers 
     WHERE LOWER(client_name) = 'alley 91' 
       AND sku = '500 P' 
     LIMIT 1) as customer_id,
    '2025-12-04'::DATE as transaction_date,
    'sale' as transaction_type,
    10000.00 as amount,
    10000.00 as total_amount,
    50 as quantity,
    '500 P' as sku,
    'Sale of 50.00 cases - 500 P' as description,
    COALESCE((SELECT branch FROM customers 
              WHERE LOWER(client_name) = 'alley 91' 
                AND sku = '500 P' 
              LIMIT 1), 'Nanakram') as branch,
    NOW() as created_at,
    NOW() as updated_at
WHERE NOT EXISTS (
    SELECT 1 FROM sales_transactions st
    INNER JOIN customers c ON st.customer_id = c.id
    WHERE LOWER(c.client_name) = 'alley 91'
      AND st.transaction_date = '2025-12-04'::DATE
      AND st.transaction_type = 'sale'
      AND st.amount = 10000.00
      AND st.quantity = 50
      AND st.sku = '500 P'
);

-- Step 8: Insert Transaction 7 - 1/27/2026: Alley 91 - 250 ml, 250 EC, 30 cases, ₹6,900
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
    (SELECT id FROM customers 
     WHERE (LOWER(client_name) LIKE '%alley%91%250%ml%' 
            OR LOWER(client_name) = 'alley 91 - 250 ml'
            OR (LOWER(client_name) LIKE '%alley%91%' AND sku = '250 EC'))
     LIMIT 1) as customer_id,
    '2026-01-27'::DATE as transaction_date,
    'sale' as transaction_type,
    6900.00 as amount,
    6900.00 as total_amount,
    30 as quantity,
    '250 EC' as sku,
    'Sale of 30.00 cases - 250 EC' as description,
    COALESCE((SELECT branch FROM customers 
              WHERE (LOWER(client_name) LIKE '%alley%91%250%ml%' 
                     OR LOWER(client_name) = 'alley 91 - 250 ml'
                     OR (LOWER(client_name) LIKE '%alley%91%' AND sku = '250 EC'))
              LIMIT 1), 'Nanakram') as branch,
    NOW() as created_at,
    NOW() as updated_at
WHERE NOT EXISTS (
    SELECT 1 FROM sales_transactions st
    INNER JOIN customers c ON st.customer_id = c.id
    WHERE (LOWER(c.client_name) LIKE '%alley%91%250%ml%' 
           OR LOWER(c.client_name) = 'alley 91 - 250 ml'
           OR (LOWER(c.client_name) LIKE '%alley%91%' AND c.sku = '250 EC'))
      AND st.transaction_date = '2026-01-27'::DATE
      AND st.transaction_type = 'sale'
      AND st.amount = 6900.00
      AND st.quantity = 30
      AND st.sku = '250 EC'
);

-- Step 9: Insert Transaction 8 - 1/27/2026: Alley 91, 500 P, 80 cases, ₹16,000
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
    (SELECT id FROM customers 
     WHERE LOWER(client_name) = 'alley 91' 
       AND sku = '500 P' 
     LIMIT 1) as customer_id,
    '2026-01-27'::DATE as transaction_date,
    'sale' as transaction_type,
    16000.00 as amount,
    16000.00 as total_amount,
    80 as quantity,
    '500 P' as sku,
    'Sale of 80.00 cases - 500 P' as description,
    COALESCE((SELECT branch FROM customers 
              WHERE LOWER(client_name) = 'alley 91' 
                AND sku = '500 P' 
              LIMIT 1), 'Nanakram') as branch,
    NOW() as created_at,
    NOW() as updated_at
WHERE NOT EXISTS (
    SELECT 1 FROM sales_transactions st
    INNER JOIN customers c ON st.customer_id = c.id
    WHERE LOWER(c.client_name) = 'alley 91'
      AND st.transaction_date = '2026-01-27'::DATE
      AND st.transaction_type = 'sale'
      AND st.amount = 16000.00
      AND st.quantity = 80
      AND st.sku = '500 P'
);

-- Step 10: Verify All Inserted Transactions
-- ==============================================
WITH alley91_customers AS (
    SELECT id, client_name, branch, sku
    FROM customers
    WHERE LOWER(client_name) LIKE '%alley%91%'
)
SELECT 
    st.transaction_date,
    c.client_name,
    st.sku,
    st.quantity,
    st.amount,
    st.transaction_type,
    st.branch,
    st.description,
    st.id as transaction_id
FROM sales_transactions st
INNER JOIN customers c ON st.customer_id = c.id
WHERE st.transaction_date IN (
    '2025-07-01'::DATE,
    '2025-08-15'::DATE,
    '2025-08-25'::DATE,
    '2025-08-31'::DATE,
    '2025-09-23'::DATE,
    '2025-12-04'::DATE,
    '2026-01-27'::DATE
)
AND c.id IN (SELECT id FROM alley91_customers)
ORDER BY st.transaction_date ASC, st.created_at ASC;

-- Step 11: View All Alley 91 Transactions with Outstanding Balance
-- ==============================================
WITH alley91_customers AS (
    SELECT id 
    FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%'
)
SELECT 
    st.transaction_date,
    c.client_name,
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
    st.created_at,
    st.id as transaction_id
FROM sales_transactions st
INNER JOIN customers c ON st.customer_id = c.id
WHERE st.customer_id IN (SELECT id FROM alley91_customers)
ORDER BY st.transaction_date ASC, st.created_at ASC;
