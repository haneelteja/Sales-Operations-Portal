-- ==============================================
-- EXTRACT ALL CUSTOMERS FROM CUSTOMERS TABLE
-- This script retrieves all customer records
-- ==============================================

-- Step 1: Check what columns actually exist in the customers table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'customers'
ORDER BY ordinal_position;

-- Step 2: Extract all customers with available columns
SELECT 
  id,
  client_name,
  branch,
  sku,
  price_per_case,
  price_per_bottle,
  is_active,
  created_at,
  updated_at
FROM customers
ORDER BY client_name, branch, sku;

-- Note: If contact_person, phone, email, or address columns exist,
-- uncomment them in the SELECT statement above

-- ==============================================
-- ALTERNATIVE QUERIES
-- ==============================================

-- Option 1: Get only active customers
-- SELECT * FROM customers WHERE is_active = true ORDER BY client_name, branch;

-- Option 2: Get summary by client (unique client-branch combinations)
-- SELECT 
--   client_name,
--   branch,
--   COUNT(*) as sku_count,
--   STRING_AGG(DISTINCT sku, ', ' ORDER BY sku) as skus,
--   MIN(price_per_bottle) as min_price,
--   MAX(price_per_bottle) as max_price
-- FROM customers
-- WHERE is_active = true
-- GROUP BY client_name, branch
-- ORDER BY client_name, branch;

-- Option 3: Export to CSV format (for Excel/Google Sheets)
-- COPY (
--   SELECT 
--     client_name,
--     branch,
--     sku,
--     price_per_case,
--     price_per_bottle,
--     is_active
--   FROM customers
--   ORDER BY client_name, branch, sku
-- ) TO '/path/to/customers_export.csv' WITH CSV HEADER;

-- Option 4: Get count summary
-- SELECT 
--   COUNT(*) as total_customers,
--   COUNT(DISTINCT client_name) as unique_clients,
--   COUNT(DISTINCT branch) as unique_branches,
--   COUNT(DISTINCT sku) as unique_skus,
--   COUNT(*) FILTER (WHERE is_active = true) as active_customers,
--   COUNT(*) FILTER (WHERE is_active = false) as inactive_customers
-- FROM customers;
