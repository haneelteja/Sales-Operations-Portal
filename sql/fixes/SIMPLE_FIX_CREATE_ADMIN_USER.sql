-- Simple script to create admin user and ensure table exists
-- Run this if you're still seeing "No users found"

-- Step 1: Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_management (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  associated_clients TEXT[] DEFAULT '{}',
  associated_branches TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  role VARCHAR(50) DEFAULT 'client' CHECK (role IN ('admin', 'manager', 'client')),
  created_by UUID,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create admin user (matching mock auth user ID)
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

-- Step 3: Verify user was created
SELECT 
  id,
  user_id,
  username,
  email,
  role,
  status,
  created_at
FROM user_management
WHERE user_id = '6e2e740b-57c6-4468-b073-b379aed3c6a6'::UUID;

-- Step 4: Show total count
SELECT COUNT(*) as total_users FROM user_management;

