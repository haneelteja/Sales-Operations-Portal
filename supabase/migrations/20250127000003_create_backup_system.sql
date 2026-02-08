-- ==============================================
-- DATABASE BACKUP SYSTEM MIGRATION
-- ==============================================
-- Creates backup_logs table and backup configurations
-- Date: 2025-01-27
-- ==============================================

-- Create backup_logs table
CREATE TABLE IF NOT EXISTS backup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type VARCHAR(20) NOT NULL CHECK (backup_type IN ('automatic', 'manual')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'in_progress')),
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT,
  google_drive_file_id VARCHAR(255),
  google_drive_path TEXT,
  failure_reason TEXT,
  triggered_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_backup_logs_status ON backup_logs(status);
CREATE INDEX IF NOT EXISTS idx_backup_logs_backup_type ON backup_logs(backup_type);
CREATE INDEX IF NOT EXISTS idx_backup_logs_started_at ON backup_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at ON backup_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_logs_triggered_by ON backup_logs(triggered_by);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_backup_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_backup_logs_updated_at
  BEFORE UPDATE ON backup_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_backup_logs_updated_at();

-- Enable Row Level Security
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Managers and admins can view all backup logs
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

-- Policy: Service role can insert backup logs
CREATE POLICY "Service role can insert backup logs"
  ON backup_logs FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can update backup logs
CREATE POLICY "Service role can update backup logs"
  ON backup_logs FOR UPDATE
  USING (true);

-- Policy: Authenticated managers can insert manual backup logs
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

-- Add backup-related configurations to invoice_configurations table
INSERT INTO invoice_configurations (config_key, config_value, config_type, description)
VALUES 
  ('backup_folder_path', 'MyDrive/DatabaseBackups', 'string', 'Google Drive folder path for database backups'),
  ('backup_notification_email', 'pega2023test@gmail.com', 'string', 'Email address for backup failure notifications'),
  ('backup_enabled', 'true', 'boolean', 'Enable/disable automated database backups')
ON CONFLICT (config_key) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE backup_logs IS 'Stores logs of all database backup operations, including automatic and manual backups';
COMMENT ON COLUMN backup_logs.backup_type IS 'Type of backup: automatic (scheduled) or manual (user-triggered)';
COMMENT ON COLUMN backup_logs.status IS 'Status: success, failed, or in_progress';
COMMENT ON COLUMN backup_logs.file_size_bytes IS 'Size of backup file in bytes';
COMMENT ON COLUMN backup_logs.google_drive_file_id IS 'Google Drive file ID for the backup file';
COMMENT ON COLUMN backup_logs.deleted_at IS 'Timestamp when backup file was deleted from Google Drive (soft delete)';
