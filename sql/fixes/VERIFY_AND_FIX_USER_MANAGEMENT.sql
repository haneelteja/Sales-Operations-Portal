-- Verification and Fix script for user_management
-- This will check if the table exists, verify data, and fix RLS issues

-- Step 1: Check if table exists and show current data
SELECT 
  'Table exists: ' || EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_management'
  ) as table_status;

-- Step 2: Show current user count (bypassing RLS for verification)
SET LOCAL row_security = off;
SELECT COUNT(*) as total_users FROM user_management;
SELECT * FROM user_management ORDER BY created_at DESC LIMIT 10;
RESET row_security;

-- Step 3: Ensure admin user exists (matching mock auth user)
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

-- Step 4: Update admin user with all clients/branches if customers table exists
DO $$
BEGIN
  UPDATE user_management 
  SET 
    associated_clients = (
      SELECT COALESCE(ARRAY_AGG(DISTINCT client_name), ARRAY[]::TEXT[])
      FROM customers 
      WHERE client_name IS NOT NULL AND client_name != ''
    ),
    associated_branches = (
      SELECT COALESCE(ARRAY_AGG(DISTINCT branch), ARRAY[]::TEXT[])
      FROM customers 
      WHERE branch IS NOT NULL AND branch != ''
    ),
    updated_at = NOW()
  WHERE role = 'admin' AND status = 'active';
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- Step 5: For development with mock auth, temporarily allow anonymous access
-- This is a temporary policy for development - remove in production
DROP POLICY IF EXISTS "Allow anonymous read for development" ON user_management;
CREATE POLICY "Allow anonymous read for development" ON user_management
  FOR SELECT USING (true);

-- Step 6: Verify the admin user was created
SELECT 
  'Admin user created: ' || EXISTS (
    SELECT 1 FROM user_management 
    WHERE user_id = '6e2e740b-57c6-4468-b073-b379aed3c6a6'::UUID
    AND role = 'admin'
  ) as admin_user_status;

