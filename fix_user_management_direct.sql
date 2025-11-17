-- Direct fix for user_management RLS policies
-- This script completely removes all RLS policies and recreates simple ones

-- First, disable RLS temporarily
ALTER TABLE user_management DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (this should work even if they don't exist)
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

-- Re-enable RLS
ALTER TABLE user_management ENABLE ROW LEVEL SECURITY;

-- Create a very simple policy that allows all operations (temporary)
CREATE POLICY "Allow all operations on user_management" ON user_management FOR ALL USING (true);





