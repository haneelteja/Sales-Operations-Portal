-- ==============================================
-- CLEAR ORDERS TABLE
-- This script will delete all data from the orders table
-- ==============================================

-- Step 1: Check current row count
SELECT COUNT(*) as current_row_count FROM orders;

-- Step 2: Delete all orders
DELETE FROM orders;

-- Step 3: Verify deletion
SELECT COUNT(*) as remaining_rows FROM orders;

-- Expected result: remaining_rows should be 0

