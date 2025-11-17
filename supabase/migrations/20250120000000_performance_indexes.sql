-- ==============================================
-- PERFORMANCE INDEXES MIGRATION
-- ==============================================
-- This migration adds critical indexes to improve query performance
-- Expected impact: 50-80% reduction in query execution time
-- ==============================================

-- ==============================================
-- 1. SALES TRANSACTIONS INDEXES
-- ==============================================

-- Index on customer_id (most common filter)
CREATE INDEX IF NOT EXISTS idx_sales_transactions_customer_id 
  ON sales_transactions(customer_id);

-- Index on transaction_type (frequently filtered)
CREATE INDEX IF NOT EXISTS idx_sales_transactions_transaction_type 
  ON sales_transactions(transaction_type);

-- Index on transaction_date (for date range queries)
CREATE INDEX IF NOT EXISTS idx_sales_transactions_transaction_date 
  ON sales_transactions(transaction_date DESC);

-- Index on created_at (for sorting and pagination)
CREATE INDEX IF NOT EXISTS idx_sales_transactions_created_at 
  ON sales_transactions(created_at DESC);

-- Index on sku (for product-based queries)
CREATE INDEX IF NOT EXISTS idx_sales_transactions_sku 
  ON sales_transactions(sku);

-- Composite index for common query pattern: customer + type + date
CREATE INDEX IF NOT EXISTS idx_sales_transactions_customer_type_date 
  ON sales_transactions(customer_id, transaction_type, transaction_date DESC);

-- Partial index for active transactions only
CREATE INDEX IF NOT EXISTS idx_sales_transactions_active 
  ON sales_transactions(transaction_date DESC) 
  WHERE transaction_date >= CURRENT_DATE - INTERVAL '1 year';

-- ==============================================
-- 2. CUSTOMERS INDEXES
-- ==============================================

-- Index on client_name (most common filter)
CREATE INDEX IF NOT EXISTS idx_customers_client_name 
  ON customers(client_name);

-- Index on branch (frequently filtered)
CREATE INDEX IF NOT EXISTS idx_customers_branch 
  ON customers(branch);

-- Index on is_active (for filtering active customers)
CREATE INDEX IF NOT EXISTS idx_customers_is_active 
  ON customers(is_active) 
  WHERE is_active = true;

-- Composite index for client_name + branch (unique constraint lookup)
CREATE INDEX IF NOT EXISTS idx_customers_client_branch 
  ON customers(client_name, branch);

-- Index on sku (for SKU-based lookups)
CREATE INDEX IF NOT EXISTS idx_customers_sku 
  ON customers(sku) 
  WHERE sku IS NOT NULL;

-- ==============================================
-- 3. FACTORY PAYABLES INDEXES
-- ==============================================

-- Index on transaction_type (frequently filtered)
CREATE INDEX IF NOT EXISTS idx_factory_payables_transaction_type 
  ON factory_payables(transaction_type);

-- Index on transaction_date (for date range queries)
CREATE INDEX IF NOT EXISTS idx_factory_payables_transaction_date 
  ON factory_payables(transaction_date DESC);

-- Index on sku (for product-based queries)
CREATE INDEX IF NOT EXISTS idx_factory_payables_sku 
  ON factory_payables(sku);

-- Index on customer_id (for customer-based queries)
CREATE INDEX IF NOT EXISTS idx_factory_payables_customer_id 
  ON factory_payables(customer_id);

-- Composite index for reporting queries
CREATE INDEX IF NOT EXISTS idx_factory_payables_type_date 
  ON factory_payables(transaction_type, transaction_date DESC);

-- ==============================================
-- 4. FACTORY PRICING INDEXES
-- ==============================================

-- Index on sku (most common filter)
CREATE INDEX IF NOT EXISTS idx_factory_pricing_sku 
  ON factory_pricing(sku);

-- Index on pricing_date (for date-based queries)
CREATE INDEX IF NOT EXISTS idx_factory_pricing_date 
  ON factory_pricing(pricing_date DESC);

-- Composite index for latest pricing per SKU (most common query)
CREATE INDEX IF NOT EXISTS idx_factory_pricing_sku_date 
  ON factory_pricing(sku, pricing_date DESC);

-- ==============================================
-- 5. TRANSPORT EXPENSES INDEXES
-- ==============================================

-- Index on expense_date (for date range queries)
CREATE INDEX IF NOT EXISTS idx_transport_expenses_expense_date 
  ON transport_expenses(expense_date DESC);

-- Index on client_id (for client-based queries)
CREATE INDEX IF NOT EXISTS idx_transport_expenses_client_id 
  ON transport_expenses(client_id);

-- Index on branch (for branch-based queries)
CREATE INDEX IF NOT EXISTS idx_transport_expenses_branch 
  ON transport_expenses(branch);

-- Composite index for client + date queries
CREATE INDEX IF NOT EXISTS idx_transport_expenses_client_date 
  ON transport_expenses(client_id, expense_date DESC);

-- ==============================================
-- 6. LABEL PURCHASES INDEXES
-- ==============================================

-- Index on purchase_date (for date range queries)
CREATE INDEX IF NOT EXISTS idx_label_purchases_purchase_date 
  ON label_purchases(purchase_date DESC);

-- Index on vendor_id (for vendor-based queries)
CREATE INDEX IF NOT EXISTS idx_label_purchases_vendor_id 
  ON label_purchases(vendor_id);

-- Index on sku (for product-based queries)
CREATE INDEX IF NOT EXISTS idx_label_purchases_sku 
  ON label_purchases(sku);

-- Composite index for vendor + date queries
CREATE INDEX IF NOT EXISTS idx_label_purchases_vendor_date 
  ON label_purchases(vendor_id, purchase_date DESC);

-- ==============================================
-- 7. LABEL PAYMENTS INDEXES
-- ==============================================

-- Index on payment_date (for date range queries)
CREATE INDEX IF NOT EXISTS idx_label_payments_payment_date 
  ON label_payments(payment_date DESC);

-- Index on vendor_id (for vendor-based queries)
CREATE INDEX IF NOT EXISTS idx_label_payments_vendor_id 
  ON label_payments(vendor_id);

-- Composite index for vendor + date queries
CREATE INDEX IF NOT EXISTS idx_label_payments_vendor_date 
  ON label_payments(vendor_id, payment_date DESC);

-- ==============================================
-- 8. ORDERS INDEXES
-- ==============================================

-- Index on status (frequently filtered)
CREATE INDEX IF NOT EXISTS idx_orders_status 
  ON orders(status);

-- Index on tentative_delivery_date (for sorting and filtering)
CREATE INDEX IF NOT EXISTS idx_orders_tentative_delivery_date 
  ON orders(tentative_delivery_date DESC);

-- Index on client (for client-based queries)
CREATE INDEX IF NOT EXISTS idx_orders_client 
  ON orders(client);

-- Index on created_at (for sorting)
CREATE INDEX IF NOT EXISTS idx_orders_created_at 
  ON orders(created_at DESC);

-- Composite index for status + delivery date (common query pattern)
CREATE INDEX IF NOT EXISTS idx_orders_status_delivery_date 
  ON orders(status, tentative_delivery_date DESC);

-- ==============================================
-- 9. USER MANAGEMENT INDEXES
-- ==============================================

-- Index on user_id (for user lookups)
CREATE INDEX IF NOT EXISTS idx_user_management_user_id 
  ON user_management(user_id);

-- Index on email (for email lookups)
CREATE INDEX IF NOT EXISTS idx_user_management_email 
  ON user_management(email);

-- Index on status (for filtering active users)
CREATE INDEX IF NOT EXISTS idx_user_management_status 
  ON user_management(status) 
  WHERE status = 'active';

-- Index on role (for role-based queries)
CREATE INDEX IF NOT EXISTS idx_user_management_role 
  ON user_management(role);

-- ==============================================
-- 10. SKU CONFIGURATIONS INDEXES
-- ==============================================

-- Index on sku (already unique, but explicit index for lookups)
CREATE INDEX IF NOT EXISTS idx_sku_configurations_sku 
  ON sku_configurations(sku);

-- ==============================================
-- 11. ANALYZE TABLES
-- ==============================================
-- Update table statistics for query planner optimization

ANALYZE sales_transactions;
ANALYZE customers;
ANALYZE factory_payables;
ANALYZE factory_pricing;
ANALYZE transport_expenses;
ANALYZE label_purchases;
ANALYZE label_payments;
ANALYZE orders;
ANALYZE user_management;
ANALYZE sku_configurations;

-- ==============================================
-- 12. VERIFICATION QUERIES
-- ==============================================
-- Run these queries to verify indexes were created

-- Check all indexes
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;

-- Check index usage statistics (after some usage)
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

