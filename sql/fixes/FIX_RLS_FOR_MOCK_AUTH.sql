-- Fix RLS policies to work with mock authentication
-- This adds a policy that allows access for development/testing

-- Step 1: Ensure admin user exists
INSERT INTO user_management (
  user_id,
  username,
  email,
  associated_clients,
  associated_branches,
  status,
  role,
  created_at,
  updated_at
) VALUES (
  '6e2e740b-57c6-4468-b073-b379aed3c6a6'::UUID,
  'nalluruhaneel@gmail.com',
  'nalluruhaneel@gmail.com',
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  'active',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  role = 'admin',
  status = 'active',
  updated_at = NOW();

-- Step 2: Add a development policy that allows SELECT for all authenticated requests
-- This works around the mock auth issue where auth.uid() might be null
DROP POLICY IF EXISTS "Development: Allow all authenticated reads" ON user_management;
CREATE POLICY "Development: Allow all authenticated reads" ON user_management
  FOR SELECT 
  USING (
    -- Allow if user_id matches current user
    auth.uid() = user_id 
    -- OR if current user is admin/manager (using helper function)
    OR is_current_user_admin_or_manager()
    -- OR if there's any authenticated session (for development)
    OR auth.role() = 'authenticated'
  );

-- Step 3: Verify the setup
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
  COUNT(*) FILTER (WHERE user_id = '6e2e740b-57c6-4468-b073-b379aed3c6a6'::UUID) as mock_auth_user_exists
FROM user_management;

