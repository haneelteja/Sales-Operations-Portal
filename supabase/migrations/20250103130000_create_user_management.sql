-- Create user_management table
CREATE TABLE IF NOT EXISTS user_management (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  associated_clients TEXT[] DEFAULT '{}', -- Array of client names
  associated_branches TEXT[] DEFAULT '{}', -- Array of branch names
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  role VARCHAR(50) DEFAULT 'client' CHECK (role IN ('admin', 'manager', 'client')),
  created_by UUID REFERENCES auth.users(id),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_management_user_id ON user_management(user_id);
CREATE INDEX IF NOT EXISTS idx_user_management_username ON user_management(username);
CREATE INDEX IF NOT EXISTS idx_user_management_email ON user_management(email);
CREATE INDEX IF NOT EXISTS idx_user_management_status ON user_management(status);

-- Enable RLS
ALTER TABLE user_management ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_management table
-- Users can only see their own record
CREATE POLICY "Users can view own user_management record" ON user_management
  FOR SELECT USING (auth.uid() = user_id);

-- Only authenticated users can insert (for self-registration after email verification)
CREATE POLICY "Users can insert own user_management record" ON user_management
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own record
CREATE POLICY "Users can update own user_management record" ON user_management
  FOR UPDATE USING (auth.uid() = user_id);

-- Only admins and managers can view all records
CREATE POLICY "Admins and managers can view all user_management records" ON user_management
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_management um 
      WHERE um.user_id = auth.uid() 
      AND um.role IN ('admin', 'manager')
      AND um.status = 'active'
    )
  );

-- Only admins can insert new user records
CREATE POLICY "Admins can insert user_management records" ON user_management
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_management um 
      WHERE um.user_id = auth.uid() 
      AND um.role = 'admin'
      AND um.status = 'active'
    )
  );

-- Only admins can update user records
CREATE POLICY "Admins can update user_management records" ON user_management
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_management um 
      WHERE um.user_id = auth.uid() 
      AND um.role = 'admin'
      AND um.status = 'active'
    )
  );

-- Only admins can delete user records
CREATE POLICY "Admins can delete user_management records" ON user_management
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_management um 
      WHERE um.user_id = auth.uid() 
      AND um.role = 'admin'
      AND um.status = 'active'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_management_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_management_updated_at
  BEFORE UPDATE ON user_management
  FOR EACH ROW
  EXECUTE FUNCTION update_user_management_updated_at();

-- Create RLS policies for data access based on user's assigned clients/branches
-- This will be applied to all relevant tables

-- Function to check if user has access to specific client/branch
CREATE OR REPLACE FUNCTION user_has_access_to_client_branch(client_name TEXT, branch_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_management um
    WHERE um.user_id = auth.uid()
    AND um.status = 'active'
    AND (
      client_name = ANY(um.associated_clients) OR 
      (client_name = ANY(um.associated_clients) AND branch_name = ANY(um.associated_branches))
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has admin role
CREATE OR REPLACE FUNCTION user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_management um
    WHERE um.user_id = auth.uid()
    AND um.role = 'admin'
    AND um.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has manager role
CREATE OR REPLACE FUNCTION user_is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_management um
    WHERE um.user_id = auth.uid()
    AND um.role = 'manager'
    AND um.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has admin or manager role
CREATE OR REPLACE FUNCTION user_is_admin_or_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_management um
    WHERE um.user_id = auth.uid()
    AND um.role IN ('admin', 'manager')
    AND um.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT um.role INTO user_role
  FROM user_management um
  WHERE um.user_id = auth.uid()
  AND um.status = 'active';
  
  RETURN COALESCE(user_role, 'client');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
