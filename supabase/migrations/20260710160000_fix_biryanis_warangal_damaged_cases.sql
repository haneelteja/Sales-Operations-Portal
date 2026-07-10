-- Biryanis and More Warangal (P 1000 ml) — 14-Jul-2025 damage reconciliation
--
-- 15 cases were damaged and returned on 14-Jul-2025:
--   Elma factory: -15 cases, ₹-1710 (comment: BnM Warangal Damaged)
--   Elma client:  -10 cases + -5 cases = -15 cases returned
--
-- The -10 stock_adjustment already exists in sales_transactions (added before the
-- transaction_type CHECK constraint was created). Two entries are missing:
--   1. factory_payables: -15 damaged cases
--   2. sales_transactions: -5 cases (the second return line)
--
-- After both are applied:
--   factory_payables total (production):        2755 + (-15) = 2740
--   sales_transactions total (sale+adjustment): 2745 + (-5)  = 2740
--   Available inventory = 0 ✓

-- Expand the constraint to recognise stock_adjustment (already present in data)
ALTER TABLE sales_transactions
  DROP CONSTRAINT IF EXISTS sales_transactions_transaction_type_check;

ALTER TABLE sales_transactions
  ADD CONSTRAINT sales_transactions_transaction_type_check
  CHECK (transaction_type IN ('sale', 'payment', 'stock_adjustment'));

-- 1. Missing factory entry: -15 damaged cases returned to factory
INSERT INTO factory_payables (customer_id, transaction_type, sku, quantity, amount, transaction_date, description)
SELECT id, 'production', 'P 1000 ml', -15, -1710, '2025-07-14',
       'BnM Warangal Damaged - 15 cases returned 14-Jul-2025'
FROM customers
WHERE client_name = 'Biryanis and More' AND branch = 'Warangal';

-- 2. Missing client entry: -5 cases (second return line; -10 already exists)
INSERT INTO sales_transactions (customer_id, transaction_type, sku, quantity, amount, total_amount, transaction_date, branch, description)
SELECT id, 'stock_adjustment', 'P 1000 ml', -5, 0, 0, '2025-07-14', 'Warangal',
       'Elma reconciliation: 5 damaged cases returned 14-Jul-2025'
FROM customers
WHERE client_name = 'Biryanis and More' AND branch = 'Warangal';
