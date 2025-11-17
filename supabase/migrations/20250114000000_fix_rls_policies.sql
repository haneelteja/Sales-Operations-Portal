-- Fix RLS policies after all tables are created
-- This migration should run after initial setup

-- First, drop the problematic function if it exists
DROP FUNCTION IF EXISTS user_has_data_access(TEXT, TEXT, TEXT);

-- Create a simpler function that doesn't cause recursion
CREATE OR REPLACE FUNCTION user_has_data_access(table_name TEXT, client_name TEXT DEFAULT NULL, branch_name TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  user_clients TEXT[];
  user_branches TEXT[];
  is_admin BOOLEAN;
BEGIN
  -- Check if user is admin by directly querying user_management
  -- Use a simple approach to avoid recursion
  SELECT EXISTS (
    SELECT 1 FROM user_management um
    WHERE um.user_id = auth.uid()
    AND um.role = 'admin'
    AND um.is_active = true
  ) INTO is_admin;
  
  -- If admin, allow all access
  IF is_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Get user's assigned clients and branches
  -- Use a try-catch approach to handle cases where user_management might not exist
  BEGIN
    SELECT um.client_branch_access, um.client_branch_access
    INTO user_clients, user_branches
    FROM user_management um
    WHERE um.user_id = auth.uid()
    AND um.is_active = true;
  EXCEPTION
    WHEN OTHERS THEN
      -- If user_management table doesn't exist or has issues, deny access
      RETURN FALSE;
  END;
  
  -- If no user record found, deny access
  IF user_clients IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- If no specific client/branch provided, check if user has any access
  IF client_name IS NULL AND branch_name IS NULL THEN
    RETURN array_length(user_clients, 1) > 0;
  END IF;
  
  -- Check client access
  IF client_name IS NOT NULL THEN
    IF NOT (client_name = ANY(user_clients)) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check branch access (if branch is specified and user has branch restrictions)
  IF branch_name IS NOT NULL AND array_length(user_branches, 1) > 0 THEN
    IF NOT (branch_name = ANY(user_branches)) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing RLS policies for sales_transactions (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_transactions') THEN
    DROP POLICY IF EXISTS "Allow all operations on sales_transactions" ON sales_transactions;
    DROP POLICY IF EXISTS "Users can view sales transactions based on client/branch access" ON sales_transactions;
    DROP POLICY IF EXISTS "Users can insert sales transactions based on client/branch access" ON sales_transactions;
    DROP POLICY IF EXISTS "Users can update sales transactions based on client/branch access" ON sales_transactions;
    DROP POLICY IF EXISTS "Users can delete sales transactions based on client/branch access" ON sales_transactions;
  END IF;
END $$;

-- New RLS policies for sales_transactions based on client/branch access
CREATE POLICY "Users can view sales transactions based on client/branch access" ON sales_transactions
  FOR SELECT USING (
    user_has_data_access('sales_transactions', 
      (SELECT client_name FROM customers WHERE id = sales_transactions.customer_id),
      (SELECT branch FROM customers WHERE id = sales_transactions.customer_id)
    )
  );

CREATE POLICY "Users can insert sales transactions based on client/branch access" ON sales_transactions
  FOR INSERT WITH CHECK (
    user_has_data_access('sales_transactions', 
      (SELECT client_name FROM customers WHERE id = sales_transactions.customer_id),
      (SELECT branch FROM customers WHERE id = sales_transactions.customer_id)
    )
  );

CREATE POLICY "Users can update sales transactions based on client/branch access" ON sales_transactions
  FOR UPDATE USING (
    user_has_data_access('sales_transactions', 
      (SELECT client_name FROM customers WHERE id = sales_transactions.customer_id),
      (SELECT branch FROM customers WHERE id = sales_transactions.customer_id)
    )
  );

CREATE POLICY "Users can delete sales transactions based on client/branch access" ON sales_transactions
  FOR DELETE USING (
    user_has_data_access('sales_transactions', 
      (SELECT client_name FROM customers WHERE id = sales_transactions.customer_id),
      (SELECT branch FROM customers WHERE id = sales_transactions.customer_id)
    )
  );

-- Update RLS policies for customers table
DROP POLICY IF EXISTS "Allow all operations on customers" ON customers;
DROP POLICY IF EXISTS "Users can view customers based on client/branch access" ON customers;
DROP POLICY IF EXISTS "Users can insert customers based on client/branch access" ON customers;
DROP POLICY IF EXISTS "Users can update customers based on client/branch access" ON customers;
DROP POLICY IF EXISTS "Users can delete customers based on client/branch access" ON customers;

CREATE POLICY "Users can view customers based on client/branch access" ON customers
  FOR SELECT USING (user_has_data_access('customers', client_name, branch));

CREATE POLICY "Users can insert customers based on client/branch access" ON customers
  FOR INSERT WITH CHECK (user_has_data_access('customers', client_name, branch));

CREATE POLICY "Users can update customers based on client/branch access" ON customers
  FOR UPDATE USING (user_has_data_access('customers', client_name, branch));

CREATE POLICY "Users can delete customers based on client/branch access" ON customers
  FOR DELETE USING (user_has_data_access('customers', client_name, branch));

-- Create simple policies for user_management table to avoid recursion
DROP POLICY IF EXISTS "Allow all operations on user_management" ON user_management;
DROP POLICY IF EXISTS "Users can view user management" ON user_management;
DROP POLICY IF EXISTS "Users can insert user management" ON user_management;
DROP POLICY IF EXISTS "Users can update user management" ON user_management;
DROP POLICY IF EXISTS "Users can delete user management" ON user_management;

-- Simple policies for user_management - allow users to see their own record and admins to see all
CREATE POLICY "Users can view user management" ON user_management
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM user_management um 
      WHERE um.user_id = auth.uid() 
      AND um.role = 'admin' 
      AND um.status = 'active'
    )
  );

CREATE POLICY "Admins can insert user management" ON user_management
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_management um 
      WHERE um.user_id = auth.uid() 
      AND um.role = 'admin' 
      AND um.status = 'active'
    )
  );

CREATE POLICY "Admins can update user management" ON user_management
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_management um 
      WHERE um.user_id = auth.uid() 
      AND um.role = 'admin' 
      AND um.status = 'active'
    )
  );

CREATE POLICY "Admins can delete user management" ON user_management
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_management um 
      WHERE um.user_id = auth.uid() 
      AND um.role = 'admin' 
      AND um.status = 'active'
    )
  );
