-- ==============================================
-- INSERT CLIENT PAYMENTS FOR APRIL 2025
-- This script inserts payment transactions (transaction_type = 'payment')
-- Payments are money received from clients
-- Negative amounts are converted to positive using ABS()
-- ==============================================

WITH payment_data AS (
  SELECT * FROM (VALUES 
    ('4/17/2025', 'Tilaks kitchen', 'Madhapur', -10040),
    ('4/21/2025', 'Element E7', 'Kukatpally', -1260),
    ('4/27/2025', 'Element E7', 'Kukatpally', -18000)
  ) AS t(transaction_date_str, client_name, branch, amount)
),
-- Convert date and prepare data
prepared_data AS (
  SELECT 
    TO_DATE(transaction_date_str, 'MM/DD/YYYY') as transaction_date,
    -- Normalize client names (handle case variations)
    CASE 
      WHEN UPPER(TRIM(client_name)) = 'TILAKS KITCHEN' THEN 'Tilaks kitchen'
      WHEN UPPER(TRIM(client_name)) = 'ELEMENT E7' THEN 'Element E7'
      ELSE TRIM(client_name)
    END as client_name,
    TRIM(branch) as branch,
    ABS(amount) as amount  -- Convert negative to positive
  FROM payment_data
)
INSERT INTO sales_transactions (
  customer_id,
  transaction_type,
  amount,
  total_amount,
  quantity,
  sku,
  description,
  transaction_date
)
SELECT 
  (SELECT id FROM customers 
   WHERE UPPER(TRIM(client_name)) = UPPER(TRIM(pd.client_name))
     AND UPPER(TRIM(branch)) = UPPER(TRIM(pd.branch))
     AND is_active = true
   LIMIT 1) as customer_id,
  'payment'::TEXT as transaction_type,
  pd.amount,
  pd.amount as total_amount,  -- total_amount same as amount for payments
  NULL as quantity,  -- Payments don't have quantity
  NULL as sku,  -- Payments don't need SKU
  'Payment received' as description,
  pd.transaction_date
FROM prepared_data pd
-- Only insert if customer exists and payment doesn't already exist
WHERE EXISTS (
  SELECT 1 FROM customers c
  WHERE UPPER(TRIM(c.client_name)) = UPPER(TRIM(pd.client_name))
    AND UPPER(TRIM(c.branch)) = UPPER(TRIM(pd.branch))
    AND c.is_active = true
)
-- Prevent duplicates: Only insert if this exact payment doesn't already exist
AND NOT EXISTS (
  SELECT 1 
  FROM sales_transactions st
  INNER JOIN customers c ON st.customer_id = c.id
  WHERE UPPER(TRIM(c.client_name)) = UPPER(TRIM(pd.client_name))
    AND UPPER(TRIM(c.branch)) = UPPER(TRIM(pd.branch))
    AND st.transaction_date = pd.transaction_date
    AND st.transaction_type = 'payment'
    AND ABS(st.amount - pd.amount) < 0.01
)
ORDER BY pd.transaction_date, pd.client_name, pd.branch;

-- Verify the import
SELECT 
  'Payments Imported' as status,
  COUNT(*) as total_payments,
  SUM(amount) as total_amount,
  MIN(transaction_date) as earliest_date,
  MAX(transaction_date) as latest_date
FROM sales_transactions
WHERE transaction_date >= '2025-04-01' 
  AND transaction_date <= '2025-04-30'
  AND transaction_type = 'payment';

-- Show imported payments with customer details
SELECT 
  c.client_name,
  c.branch,
  st.transaction_date,
  st.amount as payment_amount,
  st.description
FROM sales_transactions st
INNER JOIN customers c ON st.customer_id = c.id
WHERE st.transaction_date >= '2025-04-01' 
  AND st.transaction_date <= '2025-04-30'
  AND st.transaction_type = 'payment'
ORDER BY st.transaction_date, c.client_name, c.branch;

-- Check for any payments that couldn't be matched to customers
WITH payment_data AS (
  SELECT * FROM (VALUES 
    ('4/17/2025', 'Tilaks kitchen', 'Madhapur', -10040),
    ('4/21/2025', 'Element E7', 'Kukatpally', -1260),
    ('4/27/2025', 'Element E7', 'Kukatpally', -18000)
  ) AS t(transaction_date_str, client_name, branch, amount)
),
prepared_data AS (
  SELECT 
    TO_DATE(transaction_date_str, 'MM/DD/YYYY') as transaction_date,
    CASE 
      WHEN UPPER(TRIM(client_name)) = 'TILAKS KITCHEN' THEN 'Tilaks kitchen'
      WHEN UPPER(TRIM(client_name)) = 'ELEMENT E7' THEN 'Element E7'
      ELSE TRIM(client_name)
    END as client_name,
    TRIM(branch) as branch,
    ABS(amount) as amount
  FROM payment_data
)
SELECT 
  'Unmatched Payments' as status,
  pd.client_name,
  pd.branch,
  pd.transaction_date,
  pd.amount
FROM prepared_data pd
LEFT JOIN customers c 
  ON UPPER(TRIM(c.client_name)) = UPPER(TRIM(pd.client_name))
  AND UPPER(TRIM(c.branch)) = UPPER(TRIM(pd.branch))
  AND c.is_active = true
WHERE c.id IS NULL;
