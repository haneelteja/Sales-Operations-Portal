-- Allow reads from user_management table
-- This policy allows all authenticated requests to read user_management

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Allow all reads" ON user_management;
DROP POLICY IF EXISTS "Development: Allow all authenticated reads" ON user_management;
DROP POLICY IF EXISTS "Allow anonymous read for development" ON user_management;

-- Create a simple policy that allows all SELECT operations
-- This is for development - restrict in production
CREATE POLICY "Allow all reads" ON user_management
  FOR SELECT 
  USING (true);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_management'
ORDER BY policyname;

-- Show current users
SELECT 
  id,
  user_id,
  username,
  email,
  role,
  status,
  created_at
FROM user_management
ORDER BY created_at DESC;

