-- Emergency fix for user_management RLS policies
-- This migration completely removes all policies and creates simple ones

-- Disable RLS temporarily to avoid recursion
ALTER TABLE user_management DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
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

-- Create a simple policy that allows all operations (temporary for development)
CREATE POLICY "Allow all operations on user_management" ON user_management FOR ALL USING (true);





