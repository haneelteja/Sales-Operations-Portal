-- ==============================================
-- FIX APRIL 2025 TRANSACTION AMOUNTS
-- Updates transaction amounts to correct values based on:
-- Amount = cases × price_per_bottle × bottles_per_case
-- ==============================================

-- Step 1: Update all April transactions with correct amounts
UPDATE sales_transactions st
SET 
  amount = st.quantity * c.price_per_bottle * fp.bottles_per_case,
  total_amount = st.quantity * c.price_per_bottle * fp.bottles_per_case,
  updated_at = NOW()
FROM customers c
INNER JOIN LATERAL (
  SELECT bottles_per_case
  FROM factory_pricing
  WHERE sku = st.sku
    AND pricing_date <= st.transaction_date
  ORDER BY pricing_date DESC
  LIMIT 1
) fp ON true
WHERE st.customer_id = c.id
  AND st.transaction_date >= '2025-04-01' 
  AND st.transaction_date <= '2025-04-30'
  AND st.transaction_type = 'sale'
  AND st.quantity IS NOT NULL
  AND c.price_per_bottle IS NOT NULL
  AND fp.bottles_per_case IS NOT NULL;

-- Step 2: Verify the updates
SELECT 
  c.client_name,
  c.branch,
  st.sku,
  st.transaction_date,
  st.quantity as cases,
  st.amount as updated_amount,
  c.price_per_bottle,
  fp.bottles_per_case,
  st.quantity * c.price_per_bottle * fp.bottles_per_case as expected_amount,
  CASE 
    WHEN ABS(st.amount - (st.quantity * c.price_per_bottle * fp.bottles_per_case)) < 0.01 
      THEN 'CORRECT'
    ELSE 'STILL WRONG'
  END as status
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

-- Step 3: Summary by client-branch (what receivables should show)
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
