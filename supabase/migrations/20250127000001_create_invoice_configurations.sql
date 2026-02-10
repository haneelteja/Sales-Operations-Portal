-- ==============================================
-- INVOICE CONFIGURATIONS TABLE MIGRATION
-- ==============================================
-- Creates table for application-level invoice configurations
-- Date: 2025-01-27
-- ==============================================

-- ==============================================
-- 1. CREATE INVOICE CONFIGURATIONS TABLE
-- ==============================================
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

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_invoice_configs_key 
  ON invoice_configurations(config_key);

-- ==============================================
-- 2. UPDATE TRIGGER FUNCTION
-- ==============================================
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

-- ==============================================
-- 3. INSERT DEFAULT CONFIGURATIONS
-- ==============================================
INSERT INTO invoice_configurations (config_key, config_value, config_type, description)
VALUES 
  ('invoice_folder_path', 'MyDrive/Invoice', 'string', 'Invoice folder path in cloud storage'),
  ('auto_invoice_generation_enabled', 'true', 'boolean', 'Enable Auto Invoice Generation'),
  ('storage_provider', 'google_drive', 'string', 'Cloud storage provider (google_drive or onedrive)')
ON CONFLICT (config_key) DO NOTHING;

-- ==============================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ==============================================
ALTER TABLE invoice_configurations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read configurations
CREATE POLICY "Allow authenticated users to read invoice configs"
  ON invoice_configurations FOR SELECT
  TO authenticated
  USING (true);

-- Allow managers to update configurations
CREATE POLICY "Allow managers to update invoice configs"
  ON invoice_configurations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_management
      WHERE user_management.user_id = auth.uid()
      AND user_management.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_management
      WHERE user_management.user_id = auth.uid()
      AND user_management.role = 'manager'
    )
  );

-- Allow managers to insert configurations (for initial setup)
CREATE POLICY "Allow managers to insert invoice configs"
  ON invoice_configurations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_management
      WHERE user_management.user_id = auth.uid()
      AND user_management.role = 'manager'
    )
  );
