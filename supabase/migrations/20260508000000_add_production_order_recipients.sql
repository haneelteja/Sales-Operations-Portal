-- Add production_order_recipients config key
-- Stores a JSON array of recipients (phone numbers or group IDs) to notify when a new order is placed

INSERT INTO invoice_configurations (config_key, config_value, config_type, description)
VALUES (
  'production_order_recipients',
  '[]',
  'string',
  'WhatsApp recipients for new order notifications (individuals or groups)'
)
ON CONFLICT (config_key) DO NOTHING;
