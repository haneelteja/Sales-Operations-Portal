-- Populate user_management table with existing users from auth.users
-- This script will create user_management records for all existing authenticated users

-- Insert existing users into user_management table
INSERT INTO user_management (user_id, username, email, associated_clients, associated_branches, role, status, created_at, updated_at)
SELECT 
  au.id as user_id,
  COALESCE(au.raw_user_meta_data->>'username', au.email) as username,
  au.email,
  ARRAY[]::TEXT[] as associated_clients, -- Empty array, to be populated later
  ARRAY[]::TEXT[] as associated_branches, -- Empty array, to be populated later
  CASE 
    WHEN au.email = 'haneel@example.com' THEN 'admin' -- Set your email as admin
    WHEN au.email LIKE '%@aamodha%' THEN 'manager' -- Set company emails as managers
    ELSE 'client' -- Default to client for others
  END as role,
  'active' as status,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
WHERE au.id NOT IN (
  SELECT user_id FROM user_management WHERE user_id IS NOT NULL
)
AND au.email IS NOT NULL;

-- Update the admin user with full access to all clients and branches
UPDATE user_management 
SET 
  associated_clients = (
    SELECT ARRAY_AGG(DISTINCT client_name) 
    FROM customers 
    WHERE client_name IS NOT NULL AND client_name != ''
  ),
  associated_branches = (
    SELECT ARRAY_AGG(DISTINCT branch) 
    FROM customers 
    WHERE branch IS NOT NULL AND branch != ''
  )
WHERE role = 'admin';

-- Update manager users with access to all clients and branches
UPDATE user_management 
SET 
  associated_clients = (
    SELECT ARRAY_AGG(DISTINCT client_name) 
    FROM customers 
    WHERE client_name IS NOT NULL AND client_name != ''
  ),
  associated_branches = (
    SELECT ARRAY_AGG(DISTINCT branch) 
    FROM customers 
    WHERE branch IS NOT NULL AND branch != ''
  )
WHERE role = 'manager';

-- For client users, you can manually assign specific clients and branches as needed
-- This will be done through the User Management interface


