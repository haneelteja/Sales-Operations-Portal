-- ==============================================
-- ABSOLUTE_PORTAL: Create invoice_configurations
-- ==============================================
-- Run this in Supabase Dashboard → SQL Editor for the project
-- used by the deployed app (ksfkgzlwgvwijjkaoaqq / Absolute_Portal).
-- Fixes: "Could not find the table 'public.invoice_configurations'"
-- ==============================================

-- 1. Table
CREATE TABLE IF NOT EXISTS invoice_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  config_type VARCHAR(20) NOT NULL CHECK (config_type IN ('string', 'boolean', 'number')),
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_configs_key
  ON invoice_configurations(config_key);

-- 2. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_invoice_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoice_configs_updated_at ON invoice_configurations;
CREATE TRIGGER trigger_update_invoice_configs_updated_at
  BEFORE UPDATE ON invoice_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_configs_updated_at();

-- 3. Seed all config keys expected by Application Configuration + Backup
INSERT INTO invoice_configurations (config_key, config_value, config_type, description)
VALUES
  ('invoice_folder_path', 'MyDrive/Invoice', 'string', 'Invoice folder path in cloud storage'),
  ('auto_invoice_generation_enabled', 'true', 'boolean', 'Enable Auto Invoice Generation'),
  ('storage_provider', 'google_drive', 'string', 'Cloud storage provider (google_drive or onedrive)'),
  ('backup_folder_path', 'MyDrive/DatabaseBackups', 'string', 'Database Backup Folder Path (Google Drive)'),
  ('backup_notification_email', '', 'string', 'Email address for backup failure notifications'),
  ('backup_enabled', 'true', 'boolean', 'Enable/disable automated database backups'),
  ('backup_retention_days', '15', 'number', 'Number of days to retain backup files before cleanup'),
  ('backup_schedule_time_ist', '14:00', 'string', 'Database Backup Time (IST)'),
  ('whatsapp_enabled', 'false', 'boolean', 'Enable WhatsApp messaging integration'),
  ('whatsapp_stock_delivered_enabled', 'false', 'boolean', 'Enable stock delivered notifications via WhatsApp'),
  ('whatsapp_invoice_enabled', 'false', 'boolean', 'Enable invoice messages via WhatsApp')
ON CONFLICT (config_key) DO NOTHING;

-- 4. RLS
ALTER TABLE invoice_configurations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running (optional)
DROP POLICY IF EXISTS "Allow authenticated users to read invoice configs" ON invoice_configurations;
DROP POLICY IF EXISTS "Allow managers to update invoice configs" ON invoice_configurations;
DROP POLICY IF EXISTS "Allow managers to insert invoice configs" ON invoice_configurations;
DROP POLICY IF EXISTS "Allow authenticated read invoice configs" ON invoice_configurations;
DROP POLICY IF EXISTS "Allow authenticated write invoice configs" ON invoice_configurations;

-- If you have user_management with role column, use these (and comment out the "Allow authenticated" pair below):
-- CREATE POLICY "Allow authenticated users to read invoice configs"
--   ON invoice_configurations FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "Allow managers to update invoice configs"
--   ON invoice_configurations FOR UPDATE TO authenticated
--   USING (EXISTS (SELECT 1 FROM user_management WHERE user_management.user_id = auth.uid() AND user_management.role = 'manager'));
-- CREATE POLICY "Allow managers to insert invoice configs"
--   ON invoice_configurations FOR INSERT TO authenticated
--   WITH CHECK (EXISTS (SELECT 1 FROM user_management WHERE user_management.user_id = auth.uid() AND user_management.role = 'manager'));

-- Simpler policies (use these if user_management doesn't exist or you want all authenticated users to manage config):
CREATE POLICY "Allow authenticated read invoice configs"
  ON invoice_configurations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write invoice configs"
  ON invoice_configurations FOR ALL TO authenticated USING (true) WITH CHECK (true);
