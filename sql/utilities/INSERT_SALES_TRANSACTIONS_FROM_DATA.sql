-- ==============================================
-- INSERT SALES TRANSACTIONS FROM TRANSACTION DATA
-- This script inserts sales transactions by looking up customer_id
-- from the customers table using client_name, branch, and SKU
-- ==============================================

WITH transaction_data AS (
  SELECT * FROM (VALUES 
    ('4/2/2025', 'Golden Pavilion', 'Banjara Hills', '750 AL', 35),
    ('4/9/2025', 'Element E7', 'Kukatpally', '1000 P', 107),
    ('4/11/2025', 'Deccan kitchen', 'Film nagar', '250 EC', 21),
    ('4/11/2025', 'Deccan kitchen', 'Film nagar', '750 P', 94),
    ('4/11/2025', 'Golden Pavilion', 'Banjara Hills', '750 AL', 48),
    ('4/11/2025', 'Tilaks kitchen', 'Madhapur', '500 P', 80),
    ('4/15/2025', 'House Party', 'Sanikpuri', '500 P', 67),
    ('4/15/2025', 'This is it café', 'Sanikpuri', '500 P', 37),
    ('4/18/2025', 'The English café', 'Nanakramguda', '750 P', 69.33333333),
    ('4/24/2025', 'Atias Kitchen', 'Gandipet', '1000 P', 22),
    ('4/24/2025', 'Tilaks kitchen', 'Madhapur', '500 P', 89),
    ('4/25/2025', 'Element E7', 'Kukatpally', '1000 P', 100)
  ) AS t(transaction_date_str, client_name, branch, sku, cases)
),
-- Convert date from MM/DD/YYYY to DATE format and calculate amount
prepared_data AS (
  SELECT 
    -- Convert date string to DATE (MM/DD/YYYY format)
    TO_DATE(transaction_date_str, 'MM/DD/YYYY') as transaction_date,
    client_name,
    branch,
    sku,
    cases,
    -- Round cases to nearest integer for quantity
    ROUND(cases)::INTEGER as quantity
  FROM transaction_data
)
INSERT INTO sales_transactions (
  customer_id,
  transaction_type,
  amount,
  quantity,
  sku,
  description,
  transaction_date
)
SELECT 
  c.id as customer_id,
  'sale'::TEXT as transaction_type,
  -- Calculate amount: cases * price_per_case
  -- If price_per_case is NULL, use cases * price_per_bottle * bottles_per_case
  -- If both are NULL, set to 0 (you may need to update manually)
  COALESCE(
    (pd.cases * c.price_per_case),
    (pd.cases * c.price_per_bottle * COALESCE(sc.bottles_per_case, 1)),
    0
  ) as amount,
  pd.quantity,
  pd.sku,
  'Sale of ' || pd.cases || ' cases' as description,
  pd.transaction_date
FROM prepared_data pd
INNER JOIN customers c 
  ON UPPER(TRIM(c.client_name)) = UPPER(TRIM(pd.client_name))
  AND UPPER(TRIM(c.branch)) = UPPER(TRIM(pd.branch))
  AND c.sku = pd.sku
LEFT JOIN sku_configurations sc 
  ON sc.sku = pd.sku
ORDER BY pd.transaction_date, pd.client_name, pd.branch;

-- Verify the import
SELECT 
  'Sales Transactions Imported' as status,
  COUNT(*) as total_transactions,
  SUM(quantity) as total_quantity,
  SUM(amount) as total_amount,
  MIN(transaction_date) as earliest_date,
  MAX(transaction_date) as latest_date
FROM sales_transactions
WHERE transaction_date >= '2025-04-01' AND transaction_date <= '2025-04-30';

-- Show transactions by client
SELECT 
  c.client_name,
  c.branch,
  COUNT(*) as transaction_count,
  SUM(st.quantity) as total_cases,
  SUM(st.amount) as total_amount
FROM sales_transactions st
INNER JOIN customers c ON st.customer_id = c.id
WHERE st.transaction_date >= '2025-04-01' AND st.transaction_date <= '2025-04-30'
GROUP BY c.client_name, c.branch
ORDER BY c.client_name, c.branch;

-- ==============================================
-- VERIFICATION: Check for any transactions that couldn't be matched to customers
-- Run this separately if you want to verify all transactions were matched
-- ==============================================
-- Note: If you see unmatched transactions, check for:
-- 1. Case sensitivity differences (e.g., "House Party" vs "House party")
-- 2. Extra spaces in names
-- 3. Missing customer records in the customers table
--
-- WITH transaction_data AS (
--   SELECT * FROM (VALUES 
--     ('4/2/2025', 'Golden Pavilion', 'Banjara Hills', '750 AL', 35),
--     ('4/9/2025', 'Element E7', 'Kukatpally', '1000 P', 107),
--     ('4/11/2025', 'Deccan kitchen', 'Film nagar', '250 EC', 21),
--     ('4/11/2025', 'Deccan kitchen', 'Film nagar', '750 P', 94),
--     ('4/11/2025', 'Golden Pavilion', 'Banjara Hills', '750 AL', 48),
--     ('4/11/2025', 'Tilaks kitchen', 'Madhapur', '500 P', 80),
--     ('4/15/2025', 'House Party', 'Sanikpuri', '500 P', 67),
--     ('4/15/2025', 'This is it café', 'Sanikpuri', '500 P', 37),
--     ('4/18/2025', 'The English café', 'Nanakramguda', '750 P', 69.33333333),
--     ('4/24/2025', 'Atias Kitchen', 'Gandipet', '1000 P', 22),
--     ('4/24/2025', 'Tilaks kitchen', 'Madhapur', '500 P', 89),
--     ('4/25/2025', 'Element E7', 'Kukatpally', '1000 P', 100)
--   ) AS t(transaction_date_str, client_name, branch, sku, cases)
-- ),
-- prepared_data AS (
--   SELECT 
--     TO_DATE(transaction_date_str, 'MM/DD/YYYY') as transaction_date,
--     client_name,
--     branch,
--     sku,
--     cases
--   FROM transaction_data
-- )
-- SELECT 
--   'Unmatched Transactions' as status,
--   pd.client_name,
--   pd.branch,
--   pd.sku,
--   pd.transaction_date
-- FROM prepared_data pd
-- LEFT JOIN customers c 
--   ON UPPER(TRIM(c.client_name)) = UPPER(TRIM(pd.client_name))
--   AND UPPER(TRIM(c.branch)) = UPPER(TRIM(pd.branch))
--   AND c.sku = pd.sku
-- WHERE c.id IS NULL;
