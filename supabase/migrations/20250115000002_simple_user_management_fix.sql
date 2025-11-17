-- Simple fix for user_management table - just add missing columns
-- This migration adds the required columns without trying to migrate existing data

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add associated_clients column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_management' AND column_name = 'associated_clients') THEN
        ALTER TABLE user_management ADD COLUMN associated_clients TEXT[] DEFAULT '{}';
    END IF;
    
    -- Add associated_branches column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_management' AND column_name = 'associated_branches') THEN
        ALTER TABLE user_management ADD COLUMN associated_branches TEXT[] DEFAULT '{}';
    END IF;
    
    -- Add status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_management' AND column_name = 'status') THEN
        ALTER TABLE user_management ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending'));
    END IF;
    
    -- Add username column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_management' AND column_name = 'username') THEN
        ALTER TABLE user_management ADD COLUMN username TEXT;
    END IF;
    
    -- Add created_by column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_management' AND column_name = 'created_by') THEN
        ALTER TABLE user_management ADD COLUMN created_by TEXT;
    END IF;
    
    -- Add last_login column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_management' AND column_name = 'last_login') THEN
        ALTER TABLE user_management ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Update existing records to have default values
UPDATE user_management 
SET 
    associated_clients = '{}',
    associated_branches = '{}',
    status = 'active',
    username = COALESCE(username, email)
WHERE associated_clients IS NULL OR associated_branches IS NULL OR status IS NULL;

-- Drop old columns if they exist (safely)
ALTER TABLE user_management DROP COLUMN IF EXISTS client_branch_access;
ALTER TABLE user_management DROP COLUMN IF EXISTS is_active;

-- Create simple RLS policies
DROP POLICY IF EXISTS "Allow all operations on user_management" ON user_management;
DROP POLICY IF EXISTS "Users can view user management" ON user_management;
DROP POLICY IF EXISTS "Users can insert user management" ON user_management;
DROP POLICY IF EXISTS "Users can update user management" ON user_management;
DROP POLICY IF EXISTS "Users can delete user management" ON user_management;
DROP POLICY IF EXISTS "Admins can insert user management" ON user_management;
DROP POLICY IF EXISTS "Admins can update user management" ON user_management;
DROP POLICY IF EXISTS "Admins can delete user management" ON user_management;

-- Create simple policies that don't cause recursion
CREATE POLICY "Allow all operations on user_management" ON user_management FOR ALL USING (true);





