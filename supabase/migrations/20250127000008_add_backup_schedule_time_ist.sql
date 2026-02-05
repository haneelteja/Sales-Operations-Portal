-- ==============================================
-- ADD BACKUP SCHEDULE TIME (IST)
-- ==============================================
-- Configurable daily backup execution time in IST (HH:MM)
-- Aligns with BACKUP_SETTINGS_SPECIFICATION.md
-- Date: 2025-01-27
-- ==============================================

INSERT INTO invoice_configurations (config_key, config_value, config_type, description)
VALUES 
  ('backup_schedule_time_ist', '14:00', 'string', 'Database Backup Time (IST)')
ON CONFLICT (config_key) DO NOTHING;

-- User-facing description for Configurations table
UPDATE invoice_configurations SET description = 'Database Backup Folder Path (Google Drive)' WHERE config_key = 'backup_folder_path';
