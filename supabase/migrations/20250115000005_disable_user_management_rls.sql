-- Completely disable RLS on user_management table to fix infinite recursion
-- This is a temporary fix for development

-- Disable RLS completely on user_management table
ALTER TABLE user_management DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies to ensure clean state
DROP POLICY IF EXISTS "Allow all operations on user_management" ON user_management;
DROP POLICY IF EXISTS "Users can view user management" ON user_management;
DROP POLICY IF EXISTS "Users can insert user management" ON user_management;
DROP POLICY IF EXISTS "Users can update user_management" ON user_management;
DROP POLICY IF EXISTS "Users can delete user_management" ON user_management;
DROP POLICY IF EXISTS "Admins can insert user management" ON user_management;
DROP POLICY IF EXISTS "Admins can update user_management" ON user_management;
DROP POLICY IF EXISTS "Admins can delete user_management" ON user_management;
DROP POLICY IF EXISTS "Users can view user management based on client/branch access" ON user_management;
DROP POLICY IF EXISTS "Users can insert user management based on client/branch access" ON user_management;
DROP POLICY IF EXISTS "Users can update user management based on client/branch access" ON user_management;
DROP POLICY IF EXISTS "Users can delete user management based on client/branch access" ON user_management;





