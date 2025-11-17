-- Final fix for user_management table RLS policies
-- This migration completely removes and recreates the policies to avoid recursion

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow all operations on user_management" ON user_management;
DROP POLICY IF EXISTS "Users can view user management" ON user_management;
DROP POLICY IF EXISTS "Users can insert user management" ON user_management;
DROP POLICY IF EXISTS "Users can update user_management" ON user_management;
DROP POLICY IF EXISTS "Users can delete user_management" ON user_management;
DROP POLICY IF EXISTS "Admins can insert user management" ON user_management;
DROP POLICY IF EXISTS "Admins can update user management" ON user_management;
DROP POLICY IF EXISTS "Admins can delete user management" ON user_management;

-- Create very simple policies that don't cause recursion
CREATE POLICY "Allow all operations on user_management" ON user_management FOR ALL USING (true);





