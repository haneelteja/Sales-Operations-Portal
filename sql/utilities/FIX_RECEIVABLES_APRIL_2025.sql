-- ==============================================
-- COMPLETE FIX FOR APRIL 2025 RECEIVABLES
-- This script:
-- 1. Removes duplicate transactions (keeps highest amount)
-- 2. Fixes incorrect amounts for remaining transactions
-- 3. Verifies the results
-- ==============================================

-- ==============================================
-- STEP 1: Remove duplicate transactions
-- Keep only the transaction with the highest amount (correct calculation)
-- ==============================================
WITH duplicates AS (
  SELECT 
    customer_id,
    transaction_date,
    sku,
    quantity,
    array_agg(id ORDER BY amount DESC) as transaction_ids
  FROM sales_transactions
  WHERE transaction_type = 'sale'
    AND transaction_date >= '2025-04-01' 
    AND transaction_date <= '2025-04-30'
  GROUP BY customer_id, transaction_date, sku, quantity
  HAVING COUNT(*) > 1
),
ids_to_delete AS (
  SELECT 
    unnest(transaction_ids[2:]) as id_to_delete
  FROM duplicates
)
DELETE FROM sales_transactions
WHERE id IN (SELECT id_to_delete FROM ids_to_delete);

-- ==============================================
-- STEP 2: Fix incorrect amounts for all April transactions
-- Recalculate: amount = cases × price_per_bottle × bottles_per_case
-- ==============================================
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

-- ==============================================
-- STEP 3: Verification - Check all April transactions
-- ==============================================
SELECT 
  'Verification: All April Transactions' as status,
  c.client_name,
  c.branch,
  st.sku,
  st.transaction_date,
  st.quantity as cases,
  st.amount as calculated_amount,
  c.price_per_bottle,
  fp.bottles_per_case,
  st.quantity * c.price_per_bottle * fp.bottles_per_case as expected_amount,
  CASE 
    WHEN ABS(st.amount - (st.quantity * c.price_per_bottle * fp.bottles_per_case)) < 0.01 
      THEN '✓ CORRECT'
    ELSE '✗ WRONG'
  END as verification_status
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

-- ==============================================
-- STEP 4: Summary by client-branch (Receivables View)
-- ==============================================
WITH sales_totals AS (
  SELECT 
    c.id as customer_id,
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
  GROUP BY c.id, c.client_name, c.branch
),
payment_totals AS (
  SELECT 
    customer_id,
    SUM(amount) as total_payments
  FROM sales_transactions
  WHERE transaction_type = 'payment'
  GROUP BY customer_id
)
SELECT 
  'Receivables Summary' as status,
  st.client_name,
  st.branch,
  st.transaction_count,
  st.total_sales,
  st.total_cases,
  COALESCE(pt.total_payments, 0) as total_payments,
  st.total_sales - COALESCE(pt.total_payments, 0) as outstanding
FROM sales_totals st
LEFT JOIN payment_totals pt ON st.customer_id = pt.customer_id
ORDER BY outstanding DESC;

-- ==============================================
-- STEP 5: Check for any remaining duplicates
-- ==============================================
SELECT 
  'Remaining Duplicates Check' as status,
  c.client_name,
  c.branch,
  st.sku,
  st.transaction_date,
  st.quantity,
  COUNT(*) as count
FROM sales_transactions st
INNER JOIN customers c ON st.customer_id = c.id
WHERE st.transaction_date >= '2025-04-01' 
  AND st.transaction_date <= '2025-04-30'
  AND st.transaction_type = 'sale'
GROUP BY c.client_name, c.branch, st.sku, st.transaction_date, st.quantity
HAVING COUNT(*) > 1;
