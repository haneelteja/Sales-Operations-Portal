-- ==============================================
-- INSERT SALES TRANSACTIONS FOR APRIL 2025
-- This script inserts sales transactions with auto-calculated amounts
-- Amount = cases × price_per_bottle (from customers) × bottles_per_case (from factory_pricing)
-- 
-- IMPORTANT: This script prevents duplicates - it will NOT insert if the same transaction already exists
-- It does NOT delete existing records - it only adds new ones that don't exist
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
-- Convert date and prepare data
prepared_data AS (
  SELECT 
    TO_DATE(transaction_date_str, 'MM/DD/YYYY') as transaction_date,
    -- Normalize client names (handle case variations)
    CASE 
      WHEN UPPER(TRIM(client_name)) = 'HOUSE PARTY' THEN 'House party'
      ELSE TRIM(client_name)
    END as client_name,
    TRIM(branch) as branch,
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
  total_amount,
  quantity,
  sku,
  description,
  transaction_date
)
SELECT 
  c.id as customer_id,
  'sale'::TEXT as transaction_type,
  -- Calculate amount: cases * price_per_bottle (from customers) * bottles_per_case (from factory_pricing)
  -- Get the latest factory_pricing record for this SKU on or before the transaction date
  pd.cases * c.price_per_bottle * fp.bottles_per_case as amount,
  -- total_amount is same as amount for sales
  pd.cases * c.price_per_bottle * fp.bottles_per_case as total_amount,
  pd.quantity,
  pd.sku,
  'Sale of ' || pd.cases || ' cases' as description,
  pd.transaction_date
FROM prepared_data pd
INNER JOIN customers c 
  ON UPPER(TRIM(c.client_name)) = UPPER(TRIM(pd.client_name))
  AND UPPER(TRIM(c.branch)) = UPPER(TRIM(pd.branch))
  AND c.sku = pd.sku
INNER JOIN LATERAL (
  -- Get the latest factory_pricing record for this SKU on or before transaction date
  -- Use INNER JOIN to ensure bottles_per_case exists (skip if not found)
  SELECT bottles_per_case
  FROM factory_pricing
  WHERE sku = pd.sku
    AND pricing_date <= pd.transaction_date
  ORDER BY pricing_date DESC
  LIMIT 1
) fp ON true
-- Prevent duplicates: Only insert if this exact transaction doesn't already exist
-- Check based on customer, date, SKU, and quantity (not amount, since amount might vary)
WHERE NOT EXISTS (
  SELECT 1 
  FROM sales_transactions st
  WHERE st.customer_id = c.id
    AND st.transaction_date = pd.transaction_date
    AND st.sku = pd.sku
    AND st.quantity = pd.quantity
    AND st.transaction_type = 'sale'
)
ORDER BY pd.transaction_date, pd.client_name, pd.branch;

-- Verify the import
SELECT 
  'Sales Transactions Imported' as status,
  COUNT(*) as total_transactions,
  SUM(quantity) as total_cases,
  SUM(amount) as total_amount,
  MIN(transaction_date) as earliest_date,
  MAX(transaction_date) as latest_date
FROM sales_transactions
WHERE transaction_date >= '2025-04-01' AND transaction_date <= '2025-04-30';

-- Show transactions by client with calculated amounts
SELECT 
  c.client_name,
  c.branch,
  st.sku,
  st.transaction_date,
  st.quantity as cases,
  c.price_per_bottle,
  fp.bottles_per_case,
  st.amount as calculated_amount,
  CASE 
    WHEN c.price_per_bottle IS NOT NULL AND fp.bottles_per_case IS NOT NULL 
      THEN 'Calculated: cases × price_per_bottle × bottles_per_case'
    WHEN c.price_per_bottle IS NOT NULL 
      THEN 'WARNING: Using default bottles_per_case = 1'
    ELSE 'WARNING: No price_per_bottle found - amount is 0'
  END as calculation_method
FROM sales_transactions st
INNER JOIN customers c ON st.customer_id = c.id
INNER JOIN LATERAL (
  SELECT bottles_per_case
  FROM factory_pricing
  WHERE sku = st.sku
    AND pricing_date <= st.transaction_date
  ORDER BY pricing_date DESC
  LIMIT 1
) fp ON true
WHERE st.transaction_date >= '2025-04-01' 
  AND st.transaction_date <= '2025-04-30'
  AND st.transaction_type = 'sale'
ORDER BY st.transaction_date, c.client_name, c.branch;

-- Check for any transactions that couldn't be matched to customers
-- (This will show if any client-branch-SKU combinations don't exist)
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
prepared_data AS (
  SELECT 
    TO_DATE(transaction_date_str, 'MM/DD/YYYY') as transaction_date,
    CASE 
      WHEN UPPER(TRIM(client_name)) = 'HOUSE PARTY' THEN 'House party'
      ELSE TRIM(client_name)
    END as client_name,
    TRIM(branch) as branch,
    sku,
    cases
  FROM transaction_data
)
SELECT 
  'Unmatched Transactions' as status,
  pd.client_name,
  pd.branch,
  pd.sku,
  pd.transaction_date,
  pd.cases
FROM prepared_data pd
LEFT JOIN customers c 
  ON UPPER(TRIM(c.client_name)) = UPPER(TRIM(pd.client_name))
  AND UPPER(TRIM(c.branch)) = UPPER(TRIM(pd.branch))
  AND c.sku = pd.sku
WHERE c.id IS NULL;
