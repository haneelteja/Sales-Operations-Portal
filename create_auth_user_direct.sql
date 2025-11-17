-- Create user directly in auth.users table
-- This is a workaround to create the auth user that the application needs

-- Insert user directly into auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '6e2e740b-57c6-4468-b073-b379aed3c6a6',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'nalluruhaneel@gmail.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create user_management record
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
  '6e2e740b-57c6-4468-b073-b379aed3c6a6',
  'nalluruhaneel@gmail.com',
  'nalluruhaneel@gmail.com',
  '{}',
  '{}',
  'active',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  status = EXCLUDED.status,
  role = EXCLUDED.role,
  updated_at = NOW();





