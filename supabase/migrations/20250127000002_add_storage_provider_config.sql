-- ==============================================
-- ADD STORAGE PROVIDER CONFIGURATION
-- ==============================================
-- Adds storage_provider configuration if it doesn't exist
-- Date: 2025-01-27
-- ==============================================

-- Insert storage provider configuration if it doesn't exist
INSERT INTO invoice_configurations (config_key, config_value, config_type, description)
VALUES 
  ('storage_provider', 'google_drive', 'string', 'Cloud storage provider (google_drive or onedrive)')
ON CONFLICT (config_key) DO NOTHING;

-- Update folder path description to be provider-agnostic
UPDATE invoice_configurations
SET description = 'Invoice folder path in cloud storage'
WHERE config_key = 'invoice_folder_path';
