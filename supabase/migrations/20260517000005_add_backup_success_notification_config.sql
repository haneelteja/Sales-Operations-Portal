-- Add backup_success_notification_enabled config key
INSERT INTO invoice_configurations (config_key, config_value, config_type, description)
VALUES (
  'backup_success_notification_enabled',
  'true',
  'boolean',
  'Send email notification when a database backup completes successfully. Failure notifications are always sent regardless of this setting.'
)
ON CONFLICT (config_key) DO NOTHING;
