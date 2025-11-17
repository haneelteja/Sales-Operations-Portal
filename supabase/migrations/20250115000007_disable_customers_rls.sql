-- Disable RLS on customers table to fix policy issues
-- This is a temporary fix for development

-- Disable RLS completely on customers table
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies to ensure clean state
DROP POLICY IF EXISTS "Allow all operations on customers" ON customers;
DROP POLICY IF EXISTS "Users can view customers based on client/branch access" ON customers;
DROP POLICY IF EXISTS "Users can insert customers based on client/branch access" ON customers;
DROP POLICY IF EXISTS "Users can update customers based on client/branch access" ON customers;
DROP POLICY IF EXISTS "Users can delete customers based on client/branch access" ON customers;





