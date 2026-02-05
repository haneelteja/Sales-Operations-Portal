-- ==============================================
-- ADD EXECUTION DURATION AND RETENTION CONFIG
-- ==============================================
-- Adds execution_duration_seconds to backup_logs and backup_retention_days config
-- Aligns with DAILY_BACKUP_SPECIFICATION_2PM_IST.md
-- Date: 2025-01-27
-- ==============================================

ALTER TABLE backup_logs
ADD COLUMN IF NOT EXISTS execution_duration_seconds NUMERIC(10,2);

COMMENT ON COLUMN backup_logs.execution_duration_seconds IS 'Duration of backup run in seconds (completed_at - started_at)';

-- Configurable retention period (days); cleanup job should read this
INSERT INTO invoice_configurations (config_key, config_value, config_type, description)
VALUES 
  ('backup_retention_days', '15', 'number', 'Number of days to retain backup files before cleanup')
ON CONFLICT (config_key) DO NOTHING;
