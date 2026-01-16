-- ==============================================
-- CLEAR ALL SALES TRANSACTIONS
-- WARNING: This will delete ALL transactions from the sales_transactions table
-- Use with caution! This action cannot be undone.
-- ==============================================

-- Step 1: Show count before deletion (for verification)
SELECT 
  'Before Deletion' as status,
  COUNT(*) as total_transactions,
  COUNT(*) FILTER (WHERE transaction_type = 'sale') as sales_count,
  COUNT(*) FILTER (WHERE transaction_type = 'payment') as payments_count,
  SUM(amount) FILTER (WHERE transaction_type = 'sale') as total_sales_amount,
  SUM(amount) FILTER (WHERE transaction_type = 'payment') as total_payments_amount,
  MIN(transaction_date) as earliest_date,
  MAX(transaction_date) as latest_date
FROM sales_transactions;

-- Step 2: Delete all transactions
DELETE FROM sales_transactions;

-- Step 3: Verify deletion (should return 0)
SELECT 
  'After Deletion' as status,
  COUNT(*) as remaining_transactions
FROM sales_transactions;

-- Step 4: Optional - Reset sequence if using auto-increment IDs
-- (Not needed for UUID primary keys, but included for completeness)
-- ALTER SEQUENCE sales_transactions_id_seq RESTART WITH 1;

-- ==============================================
-- ALTERNATIVE: Delete by date range (safer option)
-- ==============================================
-- If you want to delete only specific date ranges, use this instead:
--
-- DELETE FROM sales_transactions 
-- WHERE transaction_date >= '2025-01-01' AND transaction_date <= '2026-12-31';
--
-- Or delete only sales or only payments:
--
-- DELETE FROM sales_transactions WHERE transaction_type = 'sale';
-- DELETE FROM sales_transactions WHERE transaction_type = 'payment';
