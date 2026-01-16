-- ==============================================
-- VERIFY APRIL 2025 TRANSACTIONS
-- Check if transactions have correct amounts
-- ==============================================

-- Check all April transactions with their calculated amounts
SELECT 
  c.client_name,
  c.branch,
  st.sku,
  st.transaction_date,
  st.quantity as cases,
  st.amount as current_amount,
  c.price_per_bottle,
  fp.bottles_per_case,
  -- Calculate what the amount SHOULD be
  st.quantity * c.price_per_bottle * fp.bottles_per_case as expected_amount,
  -- Check if amounts match
  CASE 
    WHEN ABS(st.amount - (st.quantity * c.price_per_bottle * fp.bottles_per_case)) < 0.01 
      THEN 'CORRECT'
    ELSE 'WRONG'
  END as status,
  ABS(st.amount - (st.quantity * c.price_per_bottle * fp.bottles_per_case)) as difference
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
ORDER BY c.client_name, c.branch, st.transaction_date, st.sku;

-- Check for duplicate transactions
SELECT 
  c.client_name,
  c.branch,
  st.sku,
  st.transaction_date,
  st.quantity,
  COUNT(*) as duplicate_count,
  array_agg(st.id) as transaction_ids,
  array_agg(st.amount ORDER BY st.amount DESC) as amounts
FROM sales_transactions st
INNER JOIN customers c ON st.customer_id = c.id
WHERE st.transaction_date >= '2025-04-01' 
  AND st.transaction_date <= '2025-04-30'
  AND st.transaction_type = 'sale'
GROUP BY c.client_name, c.branch, st.sku, st.transaction_date, st.quantity
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Summary by client-branch (what receivables should show)
SELECT 
  c.client_name,
  c.branch,
  COUNT(*) as transaction_count,
  SUM(st.amount) as total_sales,
  SUM(st.quantity) as total_cases
FROM sales_transactions st
INNER JOIN customers c ON st.customer_id = c.id
WHERE st.transaction_date >= '2025-04-01' 
  AND st.transaction_date <= '2025-04-30'
  AND st.transaction_type = 'sale'
GROUP BY c.client_name, c.branch
ORDER BY total_sales DESC;
