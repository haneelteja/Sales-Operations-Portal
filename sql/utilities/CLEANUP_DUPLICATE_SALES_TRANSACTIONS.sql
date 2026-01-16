-- ==============================================
-- CLEANUP DUPLICATE SALES TRANSACTIONS
-- This script removes duplicate transactions, keeping only the one with correct amount
-- (the one with higher amount, which should be the correct calculation)
-- ==============================================

-- Step 1: Identify duplicates (same customer, date, SKU, quantity)
WITH duplicates AS (
  SELECT 
    customer_id,
    transaction_date,
    sku,
    quantity,
    COUNT(*) as duplicate_count,
    array_agg(id ORDER BY amount DESC) as transaction_ids,
    array_agg(amount ORDER BY amount DESC) as amounts
  FROM sales_transactions
  WHERE transaction_type = 'sale'
  GROUP BY customer_id, transaction_date, sku, quantity
  HAVING COUNT(*) > 1
)
SELECT 
  'Duplicate Transactions Found' as status,
  COUNT(*) as duplicate_groups,
  SUM(duplicate_count) as total_duplicate_records
FROM duplicates;

-- Step 2: Delete duplicates, keeping only the record with the highest amount
-- (assuming the correct calculation has the higher amount)
WITH duplicates AS (
  SELECT 
    customer_id,
    transaction_date,
    sku,
    quantity,
    array_agg(id ORDER BY amount DESC) as transaction_ids
  FROM sales_transactions
  WHERE transaction_type = 'sale'
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

-- Step 3: Verify cleanup
SELECT 
  'After Cleanup' as status,
  COUNT(*) as remaining_transactions
FROM sales_transactions
WHERE transaction_type = 'sale';

-- Step 4: Check if any duplicates remain
SELECT 
  'Remaining Duplicates' as status,
  customer_id,
  transaction_date,
  sku,
  quantity,
  COUNT(*) as count
FROM sales_transactions
WHERE transaction_type = 'sale'
GROUP BY customer_id, transaction_date, sku, quantity
HAVING COUNT(*) > 1;
