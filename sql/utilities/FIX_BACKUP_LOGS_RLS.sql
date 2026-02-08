-- ==============================================
-- FIX BACKUP LOGS RLS POLICIES
-- ==============================================
-- Drop and recreate RLS policies with correct table references
-- Run this if you got the "user_profiles does not exist" error
-- ==============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Managers can view backup logs" ON backup_logs;
DROP POLICY IF EXISTS "Managers can insert manual backup logs" ON backup_logs;

-- Recreate policies with correct table references
CREATE POLICY "Managers can view backup logs"
  ON backup_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_management
      WHERE user_management.user_id = auth.uid()
      AND user_management.role IN ('manager', 'admin')
      AND user_management.status = 'active'
    )
  );

CREATE POLICY "Managers can insert manual backup logs"
  ON backup_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_management
      WHERE user_management.user_id = auth.uid()
      AND user_management.role IN ('manager', 'admin')
      AND user_management.status = 'active'
    )
  );
