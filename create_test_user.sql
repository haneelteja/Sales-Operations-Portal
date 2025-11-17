-- Create a test user for authentication
-- This will create both auth user and user_management record

-- First, create the auth user (this needs to be done through Supabase dashboard or API)
-- For now, let's create a user_management record that matches the expected user

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
  '522e3037-0b9f-4c19-b936-368f9f65a49b', -- This should match the auth user ID
  'nalluruhaneel@gmail.com',
  'nalluruhaneel@gmail.com',
  '{}',
  '{}',
  'active',
  'admin', -- Make this user an admin
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  status = EXCLUDED.status,
  role = EXCLUDED.role,
  updated_at = NOW();





