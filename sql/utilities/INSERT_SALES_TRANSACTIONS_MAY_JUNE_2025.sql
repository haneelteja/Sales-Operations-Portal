-- ==============================================
-- INSERT SALES TRANSACTIONS FOR MAY-JUNE 2025
-- This script inserts sales transactions with auto-calculated amounts
-- Amount = cases × price_per_bottle (from customers) × bottles_per_case (from factory_pricing)
-- 
-- IMPORTANT: This script prevents duplicates - it will NOT insert if the same transaction already exists
-- It does NOT delete existing records - it only adds new ones that don't exist
-- ==============================================

WITH transaction_data AS (
  SELECT * FROM (VALUES 
    ('5/1/2025', 'Fusion Aroma', 'Nallagandla', '1000 P', 19.00),
    ('5/1/2025', 'Golden Pavilion', 'Banjara Hills', '750 AL', 65.00),
    ('5/1/2025', 'Good Vibes', 'Khajaguda', '500 P', 27.00),
    ('5/2/2025', 'This is it café', 'Sanikpuri', '500 P', 64.00),
    ('5/3/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 44.00),
    ('5/6/2025', 'Deccan kitchen', 'Film nagar', '750 P', 78.00),
    ('5/7/2025', 'Tilaks kitchen', 'Madhapur', '500 P', 100.00),
    ('5/8/2025', 'Element E7', 'Kukatpally', '1000 P', 95.00),
    ('5/10/2025', 'House Party', 'Sanikpuri', '500 P', 75.00),
    ('5/10/2025', 'This is it café', 'Sanikpuri', '500 P', 75.00),
    ('5/13/2025', 'Gismat', 'Ameerpet', '500 P', 135.00),
    ('5/13/2025', 'Gismat', 'Dilshuknagar', '500 P', 150.00),
    ('5/17/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 75.00),
    ('5/17/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 75.00),
    ('5/18/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 311.00),
    ('5/19/2025', 'Element E7', 'Kukatpally', '1000 P', 120.00),
    ('5/20/2025', 'Gismat', 'Ameerpet', '500 P', 140.00),
    ('5/20/2025', 'Gismat', 'Chandha Nagar', '500 P', 40.00),
    ('5/23/2025', 'Tilaks kitchen', 'Madhapur', '500 P', 150.00),
    ('5/24/2025', 'AAHA', 'Khajaguda', '500 AL', 67.50),
    ('5/24/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 250.00),
    ('5/24/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 370.00),
    ('5/28/2025', 'Deccan kitchen', 'Film nagar', '250 EC', 39.00),
    ('5/28/2025', 'Deccan kitchen', 'Film nagar', '750 P', 132.00),
    ('5/28/2025', 'Golden Pavilion', 'Banjara Hills', '750 AL', 60.00),
    ('5/29/2025', 'Gismat', 'Ameerpet', '500 P', 100.00),
    ('5/29/2025', 'Gismat', 'Pragathi nagar', '500 P', 50.00),
    ('5/30/2025', 'Atias Kitchen', 'Gandipet', '1000 P', 85.00),
    ('5/30/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 130.00),
    ('5/30/2025', 'Gismat', 'Kondapur', '500 P', 160.00),
    ('5/31/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 115.00),
    ('6/1/2025', 'Gismat', 'Dilshuknagar', '500 P', 153.00),
    ('6/1/2025', 'House Party', 'Sanikpuri', '500 P', 73.00),
    ('6/1/2025', 'This is it café', 'Sanikpuri', '500 P', 110.00),
    ('6/5/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 10.00),
    ('6/5/2025', 'Good Vibes', 'Khajaguda', '500 P', 20.00),
    ('6/5/2025', 'Tara South Indian', 'Hitech City', '500 P', 20.00),
    ('6/6/2025', 'Element E7', 'Kukatpally', '1000 P', 50.00),
    ('6/6/2025', 'Gismat', 'Chandha Nagar', '500 P', 120.00),
    ('6/7/2025', 'Varsha grand Hotel', 'Bachupally', '1000 P', 1.00),
    ('6/8/2025', 'Gismat', 'Ameerpet', '500 P', 58.00),
    ('6/10/2025', 'Fusion Aroma', 'Nallagandla', '1000 P', 10.00),
    ('6/11/2025', 'This is it café', 'Sanikpuri', '500 P', 42.00),
    ('6/12/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 38.00),
    ('6/12/2025', 'Fusion Aroma', 'Nallagandla', '1000 P', 40.00),
    ('6/12/2025', 'Gismat', 'Dilshuknagar', '500 P', 125.00),
    ('6/12/2025', 'Golden Pavilion', 'Banjara Hills', '750 AL', 45.00),
    ('6/12/2025', 'Tara South Indian', 'Hitech City', '500 P', 150.00),
    ('6/13/2025', 'Element E7', 'Kukatpally', '1000 P', 95.00),
    ('6/14/2025', 'Gismat', 'Ameerpet', '500 P', 20.00),
    ('6/14/2025', 'Gismat', 'Kondapur', '500 P', 20.00),
    ('6/15/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 125.00),
    ('6/15/2025', 'Tilaks kitchen', 'Madhapur', '500 P', 29.00),
    ('6/17/2025', 'Gismat', 'Ameerpet', '500 P', 150.00),
    ('6/18/2025', 'House Party', 'Sanikpuri', '500 P', 60.00),
    ('6/21/2025', 'Gismat', 'Dilshuknagar', '500 P', 50.00),
    ('6/21/2025', 'Varsha grand Hotel', 'Bachupally', '1000 P', 25.00),
    ('6/22/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 160.00),
    ('6/22/2025', 'Gismat', 'Lakshmipuram', '500 P', 160.00),
    ('6/22/2025', 'Tilaks kitchen', 'Madhapur', '500 P', 55.00),
    ('6/24/2025', 'Element E7', 'Kukatpally', '1000 P', 110.00),
    ('6/24/2025', 'Varsha grand Hotel', 'Bachupally', '1000 P', 15.00),
    ('6/26/2025', 'Gismat', 'Dilshuknagar', '500 P', 85.00),
    ('6/26/2025', 'Krigo', 'Elluru', '1000 P', 74.00),
    ('6/26/2025', 'Mid land', 'Telangana', '1000 P', 64.00),
    ('6/26/2025', 'Tonique', 'Vijayawada', '1000 P', 162.00),
    ('6/27/2025', 'Gismat', 'Ameerpet', '500 P', 40.00),
    ('6/28/2025', 'Tilaks kitchen', 'Madhapur', '500 P', 40.00),
    ('6/30/2025', 'Gismat', 'chandha Nagar', '500 P', 50.00),
    ('6/30/2025', 'Gismat', 'Pragathi nagar', '500 P', 50.00)
  ) AS t(transaction_date_str, client_name, branch, sku, cases)
),
-- Convert date and prepare data
prepared_data AS (
  SELECT 
    TO_DATE(t.transaction_date_str, 'MM/DD/YYYY') as transaction_date,
    -- Normalize client names (handle case variations)
    CASE 
      WHEN UPPER(TRIM(t.client_name)) = 'HOUSE PARTY' THEN 'House party'
      WHEN UPPER(TRIM(t.client_name)) = 'TILAKS KITCHEN' THEN 'Tilaks kitchen'
      WHEN UPPER(TRIM(t.client_name)) = 'ELEMENT E7' THEN 'Element E7'
      WHEN UPPER(TRIM(t.client_name)) = 'DECCAN KITCHEN' THEN 'Deccan kitchen'
      WHEN UPPER(TRIM(t.client_name)) = 'GOLDEN PAVILION' THEN 'Golden Pavilion'
      WHEN UPPER(TRIM(t.client_name)) = 'ATIAS KITCHEN' THEN 'Atias Kitchen'
      WHEN UPPER(TRIM(t.client_name)) = 'BENGULURU BHAVAN' THEN 'benguluru Bhavan'
      WHEN UPPER(TRIM(t.client_name)) = 'TARA SOUTH INDIAN' THEN 'Tara South Indian'
      WHEN UPPER(TRIM(t.client_name)) = 'VARSHA GRAND HOTEL' THEN 'Varsha grand Hotel'
      WHEN UPPER(TRIM(t.client_name)) = 'KRIGO' THEN 'krigo'
      WHEN UPPER(TRIM(t.client_name)) = 'MID LAND' THEN 'Mid land'
      WHEN UPPER(TRIM(t.client_name)) = 'AAHA' THEN 'Aaha'
      WHEN UPPER(TRIM(t.client_name)) = 'BIRYANIS AND MORE' THEN 'Biryanis and More'
      WHEN UPPER(TRIM(t.client_name)) = 'GOOD VIBES' THEN 'Good Vibes'
      WHEN UPPER(TRIM(t.client_name)) = 'THIS IS IT CAFÉ' THEN 'This is it café'
      WHEN UPPER(TRIM(t.client_name)) = 'GISMAT' THEN 'Gismat'
      WHEN UPPER(TRIM(t.client_name)) = 'TONIQUE' THEN 'Tonique'
      WHEN UPPER(TRIM(t.client_name)) = 'FUSION AROMA' THEN 'Fusion Aroma'
      ELSE TRIM(t.client_name)
    END as client_name,
    -- Normalize branch names (handle case variations)
    CASE 
      WHEN UPPER(TRIM(t.branch)) = 'CHANDHA NAGAR' THEN 'Chandha Nagar'
      WHEN UPPER(TRIM(t.branch)) = 'PRAGATHI NAGAR' THEN 'Pragathi nagar'
      WHEN UPPER(TRIM(t.branch)) = 'DILSHUKNAGAR' THEN 'Dilshuknagar'
      WHEN UPPER(TRIM(t.branch)) = 'FILM NAGAR' THEN 'Film nagar'
      WHEN UPPER(TRIM(t.branch)) = 'BACHUPALLY' THEN 'Bachupally'
      ELSE TRIM(t.branch)
    END as branch,
    t.sku,
    t.cases,
    -- Round cases to nearest integer for quantity
    ROUND(t.cases)::INTEGER as quantity
  FROM transaction_data t
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
-- Only insert transactions where all required values are present
WHERE c.price_per_bottle IS NOT NULL
  AND fp.bottles_per_case IS NOT NULL
  AND pd.cases IS NOT NULL
  AND pd.cases > 0
-- Prevent duplicates: Only insert if this exact transaction doesn't already exist
  AND NOT EXISTS (
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
WHERE transaction_date >= '2025-05-01' AND transaction_date <= '2025-06-30';

-- Check for transactions that were skipped due to missing pricing
WITH transaction_data AS (
  SELECT * FROM (VALUES 
    ('5/1/2025', 'Fusion Aroma', 'Nallagandla', '1000 P', 19.00),
    ('5/1/2025', 'Golden Pavilion', 'Banjara Hills', '750 AL', 65.00),
    ('5/1/2025', 'Good Vibes', 'Khajaguda', '500 P', 27.00),
    ('5/2/2025', 'This is it café', 'Sanikpuri', '500 P', 64.00),
    ('5/3/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 44.00),
    ('5/6/2025', 'Deccan kitchen', 'Film nagar', '750 P', 78.00),
    ('5/7/2025', 'Tilaks kitchen', 'Madhapur', '500 P', 100.00),
    ('5/8/2025', 'Element E7', 'Kukatpally', '1000 P', 95.00),
    ('5/10/2025', 'House Party', 'Sanikpuri', '500 P', 75.00),
    ('5/10/2025', 'This is it café', 'Sanikpuri', '500 P', 75.00),
    ('5/13/2025', 'Gismat', 'Ameerpet', '500 P', 135.00),
    ('5/13/2025', 'Gismat', 'Dilshuknagar', '500 P', 150.00),
    ('5/17/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 75.00),
    ('5/17/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 75.00),
    ('5/18/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 311.00),
    ('5/19/2025', 'Element E7', 'Kukatpally', '1000 P', 120.00),
    ('5/20/2025', 'Gismat', 'Ameerpet', '500 P', 140.00),
    ('5/20/2025', 'Gismat', 'Chandha Nagar', '500 P', 40.00),
    ('5/23/2025', 'Tilaks kitchen', 'Madhapur', '500 P', 150.00),
    ('5/24/2025', 'AAHA', 'Khajaguda', '500 AL', 67.50),
    ('5/24/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 250.00),
    ('5/24/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 370.00),
    ('5/28/2025', 'Deccan kitchen', 'Film nagar', '250 EC', 39.00),
    ('5/28/2025', 'Deccan kitchen', 'Film nagar', '750 P', 132.00),
    ('5/28/2025', 'Golden Pavilion', 'Banjara Hills', '750 AL', 60.00),
    ('5/29/2025', 'Gismat', 'Ameerpet', '500 P', 100.00),
    ('5/29/2025', 'Gismat', 'Pragathi nagar', '500 P', 50.00),
    ('5/30/2025', 'Atias Kitchen', 'Gandipet', '1000 P', 85.00),
    ('5/30/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 130.00),
    ('5/30/2025', 'Gismat', 'Kondapur', '500 P', 160.00),
    ('5/31/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 115.00),
    ('6/1/2025', 'Gismat', 'Dilshuknagar', '500 P', 153.00),
    ('6/1/2025', 'House Party', 'Sanikpuri', '500 P', 73.00),
    ('6/1/2025', 'This is it café', 'Sanikpuri', '500 P', 110.00),
    ('6/5/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 10.00),
    ('6/5/2025', 'Good Vibes', 'Khajaguda', '500 P', 20.00),
    ('6/5/2025', 'Tara South Indian', 'Hitech City', '500 P', 20.00),
    ('6/6/2025', 'Element E7', 'Kukatpally', '1000 P', 50.00),
    ('6/6/2025', 'Gismat', 'Chandha Nagar', '500 P', 120.00),
    ('6/7/2025', 'Varsha grand Hotel', 'Bachupally', '1000 P', 1.00),
    ('6/8/2025', 'Gismat', 'Ameerpet', '500 P', 58.00),
    ('6/10/2025', 'Fusion Aroma', 'Nallagandla', '1000 P', 10.00),
    ('6/11/2025', 'This is it café', 'Sanikpuri', '500 P', 42.00),
    ('6/12/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 38.00),
    ('6/12/2025', 'Fusion Aroma', 'Nallagandla', '1000 P', 40.00),
    ('6/12/2025', 'Gismat', 'Dilshuknagar', '500 P', 125.00),
    ('6/12/2025', 'Golden Pavilion', 'Banjara Hills', '750 AL', 45.00),
    ('6/12/2025', 'Tara South Indian', 'Hitech City', '500 P', 150.00),
    ('6/13/2025', 'Element E7', 'Kukatpally', '1000 P', 95.00),
    ('6/14/2025', 'Gismat', 'Ameerpet', '500 P', 20.00),
    ('6/14/2025', 'Gismat', 'Kondapur', '500 P', 20.00),
    ('6/15/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 125.00),
    ('6/15/2025', 'Tilaks kitchen', 'Madhapur', '500 P', 29.00),
    ('6/17/2025', 'Gismat', 'Ameerpet', '500 P', 150.00),
    ('6/18/2025', 'House Party', 'Sanikpuri', '500 P', 60.00),
    ('6/21/2025', 'Gismat', 'Dilshuknagar', '500 P', 50.00),
    ('6/21/2025', 'Varsha grand Hotel', 'Bachupally', '1000 P', 25.00),
    ('6/22/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 160.00),
    ('6/22/2025', 'Gismat', 'Lakshmipuram', '500 P', 160.00),
    ('6/22/2025', 'Tilaks kitchen', 'Madhapur', '500 P', 55.00),
    ('6/24/2025', 'Element E7', 'Kukatpally', '1000 P', 110.00),
    ('6/24/2025', 'Varsha grand Hotel', 'Bachupally', '1000 P', 15.00),
    ('6/26/2025', 'Gismat', 'Dilshuknagar', '500 P', 85.00),
    ('6/26/2025', 'Krigo', 'Elluru', '1000 P', 74.00),
    ('6/26/2025', 'Mid land', 'Telangana', '1000 P', 64.00),
    ('6/26/2025', 'Tonique', 'Vijayawada', '1000 P', 162.00),
    ('6/27/2025', 'Gismat', 'Ameerpet', '500 P', 40.00),
    ('6/28/2025', 'Tilaks kitchen', 'Madhapur', '500 P', 40.00),
    ('6/30/2025', 'Gismat', 'chandha Nagar', '500 P', 50.00),
    ('6/30/2025', 'Gismat', 'Pragathi nagar', '500 P', 50.00)
  ) AS t(transaction_date_str, client_name, branch, sku, cases)
),
prepared_data AS (
  SELECT 
    TO_DATE(t.transaction_date_str, 'MM/DD/YYYY') as transaction_date,
    CASE 
      WHEN UPPER(TRIM(t.client_name)) = 'HOUSE PARTY' THEN 'House party'
      WHEN UPPER(TRIM(t.client_name)) = 'TILAKS KITCHEN' THEN 'Tilaks kitchen'
      WHEN UPPER(TRIM(t.client_name)) = 'ELEMENT E7' THEN 'Element E7'
      WHEN UPPER(TRIM(t.client_name)) = 'DECCAN KITCHEN' THEN 'Deccan kitchen'
      WHEN UPPER(TRIM(t.client_name)) = 'GOLDEN PAVILION' THEN 'Golden Pavilion'
      WHEN UPPER(TRIM(t.client_name)) = 'ATIAS KITCHEN' THEN 'Atias Kitchen'
      WHEN UPPER(TRIM(t.client_name)) = 'BENGULURU BHAVAN' THEN 'benguluru Bhavan'
      WHEN UPPER(TRIM(t.client_name)) = 'TARA SOUTH INDIAN' THEN 'Tara South Indian'
      WHEN UPPER(TRIM(t.client_name)) = 'VARSHA GRAND HOTEL' THEN 'Varsha grand Hotel'
      WHEN UPPER(TRIM(t.client_name)) = 'KRIGO' THEN 'krigo'
      WHEN UPPER(TRIM(t.client_name)) = 'MID LAND' THEN 'Mid land'
      WHEN UPPER(TRIM(t.client_name)) = 'AAHA' THEN 'Aaha'
      WHEN UPPER(TRIM(t.client_name)) = 'BIRYANIS AND MORE' THEN 'Biryanis and More'
      WHEN UPPER(TRIM(t.client_name)) = 'GOOD VIBES' THEN 'Good Vibes'
      WHEN UPPER(TRIM(t.client_name)) = 'THIS IS IT CAFÉ' THEN 'This is it café'
      WHEN UPPER(TRIM(t.client_name)) = 'GISMAT' THEN 'Gismat'
      WHEN UPPER(TRIM(t.client_name)) = 'TONIQUE' THEN 'Tonique'
      WHEN UPPER(TRIM(t.client_name)) = 'FUSION AROMA' THEN 'Fusion Aroma'
      ELSE TRIM(t.client_name)
    END as client_name,
    CASE 
      WHEN UPPER(TRIM(t.branch)) = 'CHANDHA NAGAR' THEN 'Chandha Nagar'
      WHEN UPPER(TRIM(t.branch)) = 'PRAGATHI NAGAR' THEN 'Pragathi nagar'
      WHEN UPPER(TRIM(t.branch)) = 'DILSHUKNAGAR' THEN 'Dilshuknagar'
      WHEN UPPER(TRIM(t.branch)) = 'FILM NAGAR' THEN 'Film nagar'
      WHEN UPPER(TRIM(t.branch)) = 'BACHUPALLY' THEN 'Bachupally'
      ELSE TRIM(t.branch)
    END as branch,
    t.sku,
    t.cases
  FROM transaction_data t
)
SELECT 
  'Skipped Transactions - Missing Pricing' as status,
  pd.client_name,
  pd.branch,
  pd.sku,
  pd.transaction_date,
  pd.cases,
  c.price_per_bottle,
  CASE 
    WHEN c.id IS NULL THEN 'Customer not found'
    WHEN c.price_per_bottle IS NULL THEN 'Missing price_per_bottle'
    WHEN fp.bottles_per_case IS NULL THEN 'Missing bottles_per_case'
    ELSE 'Other'
  END as reason
FROM prepared_data pd
LEFT JOIN customers c 
  ON UPPER(TRIM(c.client_name)) = UPPER(TRIM(pd.client_name))
  AND UPPER(TRIM(c.branch)) = UPPER(TRIM(pd.branch))
  AND c.sku = pd.sku
LEFT JOIN LATERAL (
  SELECT bottles_per_case
  FROM factory_pricing
  WHERE sku = pd.sku
    AND pricing_date <= pd.transaction_date
  ORDER BY pricing_date DESC
  LIMIT 1
) fp ON true
WHERE c.id IS NULL 
   OR c.price_per_bottle IS NULL 
   OR fp.bottles_per_case IS NULL
ORDER BY pd.transaction_date, pd.client_name, pd.branch;

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
WHERE st.transaction_date >= '2025-05-01' 
  AND st.transaction_date <= '2025-06-30'
  AND st.transaction_type = 'sale'
ORDER BY st.transaction_date, c.client_name, c.branch;

-- Check for any transactions that couldn't be matched to customers
-- (This will show if any client-branch-SKU combinations don't exist)
WITH transaction_data AS (
  SELECT * FROM (VALUES 
    ('5/1/2025', 'Fusion Aroma', 'Nallagandla', '1000 P', 19.00),
    ('5/1/2025', 'Golden Pavilion', 'Banjara Hills', '750 AL', 65.00),
    ('5/1/2025', 'Good Vibes', 'Khajaguda', '500 P', 27.00),
    ('5/2/2025', 'This is it café', 'Sanikpuri', '500 P', 64.00),
    ('5/3/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 44.00),
    ('5/6/2025', 'Deccan kitchen', 'Film nagar', '750 P', 78.00),
    ('5/7/2025', 'Tilaks kitchen', 'Madhapur', '500 P', 100.00),
    ('5/8/2025', 'Element E7', 'Kukatpally', '1000 P', 95.00),
    ('5/10/2025', 'House Party', 'Sanikpuri', '500 P', 75.00),
    ('5/10/2025', 'This is it café', 'Sanikpuri', '500 P', 75.00),
    ('5/13/2025', 'Gismat', 'Ameerpet', '500 P', 135.00),
    ('5/13/2025', 'Gismat', 'Dilshuknagar', '500 P', 150.00),
    ('5/17/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 75.00),
    ('5/17/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 75.00),
    ('5/18/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 311.00),
    ('5/19/2025', 'Element E7', 'Kukatpally', '1000 P', 120.00),
    ('5/20/2025', 'Gismat', 'Ameerpet', '500 P', 140.00),
    ('5/20/2025', 'Gismat', 'Chandha Nagar', '500 P', 40.00),
    ('5/23/2025', 'Tilaks kitchen', 'Madhapur', '500 P', 150.00),
    ('5/24/2025', 'AAHA', 'Khajaguda', '500 AL', 67.50),
    ('5/24/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 250.00),
    ('5/24/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 370.00),
    ('5/28/2025', 'Deccan kitchen', 'Film nagar', '250 EC', 39.00),
    ('5/28/2025', 'Deccan kitchen', 'Film nagar', '750 P', 132.00),
    ('5/28/2025', 'Golden Pavilion', 'Banjara Hills', '750 AL', 60.00),
    ('5/29/2025', 'Gismat', 'Ameerpet', '500 P', 100.00),
    ('5/29/2025', 'Gismat', 'Pragathi nagar', '500 P', 50.00),
    ('5/30/2025', 'Atias Kitchen', 'Gandipet', '1000 P', 85.00),
    ('5/30/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 130.00),
    ('5/30/2025', 'Gismat', 'Kondapur', '500 P', 160.00),
    ('5/31/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 115.00),
    ('6/1/2025', 'Gismat', 'Dilshuknagar', '500 P', 153.00),
    ('6/1/2025', 'House Party', 'Sanikpuri', '500 P', 73.00),
    ('6/1/2025', 'This is it café', 'Sanikpuri', '500 P', 110.00),
    ('6/5/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 10.00),
    ('6/5/2025', 'Good Vibes', 'Khajaguda', '500 P', 20.00),
    ('6/5/2025', 'Tara South Indian', 'Hitech City', '500 P', 20.00),
    ('6/6/2025', 'Element E7', 'Kukatpally', '1000 P', 50.00),
    ('6/6/2025', 'Gismat', 'Chandha Nagar', '500 P', 120.00),
    ('6/7/2025', 'Varsha grand Hotel', 'Bachupally', '1000 P', 1.00),
    ('6/8/2025', 'Gismat', 'Ameerpet', '500 P', 58.00),
    ('6/10/2025', 'Fusion Aroma', 'Nallagandla', '1000 P', 10.00),
    ('6/11/2025', 'This is it café', 'Sanikpuri', '500 P', 42.00),
    ('6/12/2025', 'Benguluru Bhavan', 'Kondapur', '500 P', 38.00),
    ('6/12/2025', 'Fusion Aroma', 'Nallagandla', '1000 P', 40.00),
    ('6/12/2025', 'Gismat', 'Dilshuknagar', '500 P', 125.00),
    ('6/12/2025', 'Golden Pavilion', 'Banjara Hills', '750 AL', 45.00),
    ('6/12/2025', 'Tara South Indian', 'Hitech City', '500 P', 150.00),
    ('6/13/2025', 'Element E7', 'Kukatpally', '1000 P', 95.00),
    ('6/14/2025', 'Gismat', 'Ameerpet', '500 P', 20.00),
    ('6/14/2025', 'Gismat', 'Kondapur', '500 P', 20.00),
    ('6/15/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 125.00),
    ('6/15/2025', 'Tilaks kitchen', 'Madhapur', '500 P', 29.00),
    ('6/17/2025', 'Gismat', 'Ameerpet', '500 P', 150.00),
    ('6/18/2025', 'House Party', 'Sanikpuri', '500 P', 60.00),
    ('6/21/2025', 'Gismat', 'Dilshuknagar', '500 P', 50.00),
    ('6/21/2025', 'Varsha grand Hotel', 'Bachupally', '1000 P', 25.00),
    ('6/22/2025', 'Biryanis and More', 'Ameerpet', '1000 P', 160.00),
    ('6/22/2025', 'Gismat', 'Lakshmipuram', '500 P', 160.00),
    ('6/22/2025', 'Tilaks kitchen', 'Madhapur', '500 P', 55.00),
    ('6/24/2025', 'Element E7', 'Kukatpally', '1000 P', 110.00),
    ('6/24/2025', 'Varsha grand Hotel', 'Bachupally', '1000 P', 15.00),
    ('6/26/2025', 'Gismat', 'Dilshuknagar', '500 P', 85.00),
    ('6/26/2025', 'Krigo', 'Elluru', '1000 P', 74.00),
    ('6/26/2025', 'Mid land', 'Telangana', '1000 P', 64.00),
    ('6/26/2025', 'Tonique', 'Vijayawada', '1000 P', 162.00),
    ('6/27/2025', 'Gismat', 'Ameerpet', '500 P', 40.00),
    ('6/28/2025', 'Tilaks kitchen', 'Madhapur', '500 P', 40.00),
    ('6/30/2025', 'Gismat', 'chandha Nagar', '500 P', 50.00),
    ('6/30/2025', 'Gismat', 'Pragathi nagar', '500 P', 50.00)
  ) AS t(transaction_date_str, client_name, branch, sku, cases)
),
prepared_data AS (
  SELECT 
    TO_DATE(transaction_date_str, 'MM/DD/YYYY') as transaction_date,
    CASE 
      WHEN UPPER(TRIM(client_name)) = 'HOUSE PARTY' THEN 'House party'
      WHEN UPPER(TRIM(client_name)) = 'TILAKS KITCHEN' THEN 'Tilaks kitchen'
      WHEN UPPER(TRIM(client_name)) = 'ELEMENT E7' THEN 'Element E7'
      WHEN UPPER(TRIM(client_name)) = 'DECCAN KITCHEN' THEN 'Deccan kitchen'
      WHEN UPPER(TRIM(client_name)) = 'GOLDEN PAVILION' THEN 'Golden Pavilion'
      WHEN UPPER(TRIM(client_name)) = 'ATIAS KITCHEN' THEN 'Atias Kitchen'
      WHEN UPPER(TRIM(client_name)) = 'BENGULURU BHAVAN' THEN 'benguluru Bhavan'
      WHEN UPPER(TRIM(client_name)) = 'TARA SOUTH INDIAN' THEN 'Tara South Indian'
      WHEN UPPER(TRIM(client_name)) = 'VARSHA GRAND HOTEL' THEN 'Varsha grand Hotel'
      WHEN UPPER(TRIM(client_name)) = 'KRIGO' THEN 'krigo'
      WHEN UPPER(TRIM(client_name)) = 'MID LAND' THEN 'Mid land'
      WHEN UPPER(TRIM(client_name)) = 'AAHA' THEN 'Aaha'
      WHEN UPPER(TRIM(client_name)) = 'BIRYANIS AND MORE' THEN 'Biryanis and More'
      WHEN UPPER(TRIM(client_name)) = 'GOOD VIBES' THEN 'Good Vibes'
      WHEN UPPER(TRIM(client_name)) = 'THIS IS IT CAFÉ' THEN 'This is it café'
      WHEN UPPER(TRIM(client_name)) = 'GISMAT' THEN 'Gismat'
      WHEN UPPER(TRIM(client_name)) = 'TONIQUE' THEN 'Tonique'
      WHEN UPPER(TRIM(client_name)) = 'FUSION AROMA' THEN 'Fusion Aroma'
      ELSE TRIM(client_name)
    END as client_name,
    CASE 
      WHEN UPPER(TRIM(branch)) = 'CHANDHA NAGAR' THEN 'Chandha Nagar'
      WHEN UPPER(TRIM(branch)) = 'PRAGATHI NAGAR' THEN 'Pragathi nagar'
      WHEN UPPER(TRIM(branch)) = 'DILSHUKNAGAR' THEN 'Dilshuknagar'
      WHEN UPPER(TRIM(branch)) = 'FILM NAGAR' THEN 'Film nagar'
      WHEN UPPER(TRIM(branch)) = 'BACHUPALLY' THEN 'Bachupally'
      ELSE TRIM(branch)
    END as branch,
    sku,
    cases
  FROM transaction_data t
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
