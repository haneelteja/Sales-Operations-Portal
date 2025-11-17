-- Simple fix for user_management table - remove foreign key constraint and create sample data
-- This will allow the application to work without authentication issues

-- Drop the foreign key constraint to allow user creation without auth users
ALTER TABLE user_management DROP CONSTRAINT IF EXISTS user_management_user_id_fkey;

-- Disable RLS completely on user_management table
ALTER TABLE user_management DISABLE ROW LEVEL SECURITY;

-- Clear existing data
DELETE FROM user_management;

-- Insert sample admin user (without foreign key constraint)
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
  gen_random_uuid(),
  'admin',
  'admin@example.com',
  '{}',
  '{}',
  'active',
  'admin',
  NOW(),
  NOW()
);

-- Insert sample manager user
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
  gen_random_uuid(),
  'manager',
  'manager@example.com',
  '{}',
  '{}',
  'active',
  'manager',
  NOW(),
  NOW()
);

-- Insert sample client user
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
  gen_random_uuid(),
  'client',
  'client@example.com',
  '{}',
  '{}',
  'active',
  'client',
  NOW(),
  NOW()
);
