-- ==============================================
-- COMPREHENSIVE DATABASE INDEX STRATEGY
-- Performance optimization for Aamodha Operations Portal
-- ==============================================

-- Sales Transactions Indexes
-- These are the most frequently queried tables
CREATE INDEX IF NOT EXISTS idx_sales_transactions_customer_id 
  ON sales_transactions(customer_id);

CREATE INDEX IF NOT EXISTS idx_sales_transactions_type_date 
  ON sales_transactions(transaction_type, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_sales_transactions_branch 
  ON sales_transactions(branch) WHERE branch IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_transactions_sku 
  ON sales_transactions(sku) WHERE sku IS NOT NULL;

-- Composite index for common query pattern: customer + branch + type + date
CREATE INDEX IF NOT EXISTS idx_sales_transactions_composite 
  ON sales_transactions(customer_id, branch, transaction_type, transaction_date DESC);

-- Customers Indexes
CREATE INDEX IF NOT EXISTS idx_customers_client_name 
  ON customers(client_name);

CREATE INDEX IF NOT EXISTS idx_customers_branch 
  ON customers(branch) WHERE branch IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_active 
  ON customers(is_active) WHERE is_active = true;

-- Composite index for unique constraint lookup
CREATE INDEX IF NOT EXISTS idx_customers_composite 
  ON customers(client_name, branch, sku, is_active);

-- Factory Pricing Indexes
CREATE INDEX IF NOT EXISTS idx_factory_pricing_sku_date 
  ON factory_pricing(sku, pricing_date DESC);

CREATE INDEX IF NOT EXISTS idx_factory_pricing_sku 
  ON factory_pricing(sku);

-- Transport Expenses Indexes
CREATE INDEX IF NOT EXISTS idx_transport_expenses_client_branch 
  ON transport_expenses(client_id, branch) WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transport_expenses_date 
  ON transport_expenses(expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_transport_expenses_group 
  ON transport_expenses(expense_group) WHERE expense_group IS NOT NULL;

-- Orders Indexes
CREATE INDEX IF NOT EXISTS idx_orders_client_name 
  ON orders(client_name);

CREATE INDEX IF NOT EXISTS idx_orders_status_date 
  ON orders(status, tentative_delivery_date DESC);

CREATE INDEX IF NOT EXISTS idx_orders_composite 
  ON orders(client_name, branch, sku, status);

-- Orders Dispatch Indexes
CREATE INDEX IF NOT EXISTS idx_orders_dispatch_client 
  ON orders_dispatch(client);

CREATE INDEX IF NOT EXISTS idx_orders_dispatch_date 
  ON orders_dispatch(delivery_date DESC);

CREATE INDEX IF NOT EXISTS idx_orders_dispatch_composite 
  ON orders_dispatch(client, branch, sku, delivery_date DESC);

-- Factory Payables Indexes
CREATE INDEX IF NOT EXISTS idx_factory_payables_type_date 
  ON factory_payables(transaction_type, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_factory_payables_customer 
  ON factory_payables(customer_id) WHERE customer_id IS NOT NULL;

-- Label Purchases Indexes
-- Note: label_purchases uses 'client_name' column, not 'client'
CREATE INDEX IF NOT EXISTS idx_label_purchases_client_name_sku 
  ON label_purchases(client_name, sku) WHERE client_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_label_purchases_date 
  ON label_purchases(purchase_date DESC);

-- Analyze tables to update statistics for query planner
ANALYZE sales_transactions;
ANALYZE customers;
ANALYZE factory_payables;
ANALYZE factory_pricing;
ANALYZE transport_expenses;
ANALYZE orders;
ANALYZE orders_dispatch;
ANALYZE label_purchases;

-- Verify indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'sales_transactions',
    'customers',
    'factory_payables',
    'factory_pricing',
    'transport_expenses',
    'orders',
    'orders_dispatch'
  )
ORDER BY tablename, indexname;

