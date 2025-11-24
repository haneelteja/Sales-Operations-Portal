-- Complete setup script for user_management table
-- This script creates the table, sets up RLS, and creates an initial admin user

-- Step 1: Create user_management table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_management (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  associated_clients TEXT[] DEFAULT '{}',
  associated_branches TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  role VARCHAR(50) DEFAULT 'client' CHECK (role IN ('admin', 'manager', 'client')),
  created_by UUID REFERENCES auth.users(id),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_management_user_id ON user_management(user_id);
CREATE INDEX IF NOT EXISTS idx_user_management_username ON user_management(username);
CREATE INDEX IF NOT EXISTS idx_user_management_email ON user_management(email);
CREATE INDEX IF NOT EXISTS idx_user_management_status ON user_management(status);
CREATE INDEX IF NOT EXISTS idx_user_management_role ON user_management(role);

-- Step 3: Create helper functions for RLS (avoid recursion)
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_management
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_current_user_admin_or_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_management
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'manager')
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Enable RLS
ALTER TABLE user_management ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow all operations on user_management" ON user_management;
DROP POLICY IF EXISTS "Users can view user management" ON user_management;
DROP POLICY IF EXISTS "Users can insert user management" ON user_management;
DROP POLICY IF EXISTS "Users can update user management" ON user_management;
DROP POLICY IF EXISTS "Users can delete user management" ON user_management;
DROP POLICY IF EXISTS "Admins can insert user management" ON user_management;
DROP POLICY IF EXISTS "Admins can update user management" ON user_management;
DROP POLICY IF EXISTS "Admins can delete user management" ON user_management;
DROP POLICY IF EXISTS "Users can view own user_management record" ON user_management;
DROP POLICY IF EXISTS "Users can insert own user_management record" ON user_management;
DROP POLICY IF EXISTS "Users can update own user_management record" ON user_management;
DROP POLICY IF EXISTS "Admins and managers can view all user_management records" ON user_management;
DROP POLICY IF EXISTS "Admins can insert user_management records" ON user_management;
DROP POLICY IF EXISTS "Admins can update user_management records" ON user_management;
DROP POLICY IF EXISTS "Admins can delete user_management records" ON user_management;
DROP POLICY IF EXISTS "Users can view own record" ON user_management;
DROP POLICY IF EXISTS "Admins and managers can view all" ON user_management;
DROP POLICY IF EXISTS "Admins can insert" ON user_management;
DROP POLICY IF EXISTS "Admins can update" ON user_management;
DROP POLICY IF EXISTS "Admins can delete" ON user_management;
DROP POLICY IF EXISTS "Users can update own record" ON user_management;

-- Step 6: Create RLS policies
CREATE POLICY "Users can view own record" ON user_management
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and managers can view all" ON user_management
  FOR SELECT USING (is_current_user_admin_or_manager());

CREATE POLICY "Admins can insert" ON user_management
  FOR INSERT WITH CHECK (is_current_user_admin());

CREATE POLICY "Admins can update" ON user_management
  FOR UPDATE USING (is_current_user_admin());

CREATE POLICY "Admins can delete" ON user_management
  FOR DELETE USING (is_current_user_admin());

CREATE POLICY "Users can update own record" ON user_management
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 7: Grant permissions on helper functions
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_current_user_admin_or_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO anon;
GRANT EXECUTE ON FUNCTION is_current_user_admin_or_manager() TO anon;

-- Step 8: Create initial admin user (matching mock auth user ID)
-- This is for development/testing with mock authentication
-- The user_id matches the mock user ID from AuthContext: '6e2e740b-57c6-4468-b073-b379aed3c6a6'
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
  ARRAY[]::TEXT[], -- Will be populated automatically for admin
  ARRAY[]::TEXT[], -- Will be populated automatically for admin
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

-- Step 9: Update admin user with all clients and branches (if customers table exists)
DO $$
BEGIN
  -- Update admin user with all available clients and branches
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
    -- customers table doesn't exist yet, skip this step
    NULL;
END $$;

-- Step 10: Create trigger for updated_at (if not exists)
CREATE OR REPLACE FUNCTION update_user_management_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_management_updated_at ON user_management;
CREATE TRIGGER update_user_management_updated_at
  BEFORE UPDATE ON user_management
  FOR EACH ROW
  EXECUTE FUNCTION update_user_management_updated_at();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'User management table setup complete!';
  RAISE NOTICE 'Admin user created with ID: 6e2e740b-57c6-4468-b073-b379aed3c6a6';
  RAISE NOTICE 'You can now refresh the User Management page.';
END $$;

