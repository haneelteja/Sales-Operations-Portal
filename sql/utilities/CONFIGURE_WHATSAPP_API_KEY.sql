-- ==============================================
-- CONFIGURE WHATSAPP API KEY
-- ==============================================
-- Updates the 360Messenger API key in invoice_configurations
-- Date: 2025-01-27
-- ==============================================

-- Update API key
UPDATE invoice_configurations
SET config_value = '1OW8XOWd3ivnnWExSQfJ8bmct8SkXGITChq'
WHERE config_key = 'whatsapp_api_key';

-- Enable WhatsApp integration
UPDATE invoice_configurations
SET config_value = 'true'
WHERE config_key = 'whatsapp_enabled';

-- Enable all message types (optional - adjust as needed)
UPDATE invoice_configurations
SET config_value = 'true'
WHERE config_key IN (
  'whatsapp_stock_delivered_enabled',
  'whatsapp_invoice_enabled',
  'whatsapp_payment_reminder_enabled',
  'whatsapp_festival_enabled'
);

-- Set API URL (default 360Messenger URL)
UPDATE invoice_configurations
SET config_value = 'https://api.360messenger.com'
WHERE config_key = 'whatsapp_api_url';

-- Verify configuration
SELECT 
  config_key,
  config_value,
  description
FROM invoice_configurations
WHERE config_key LIKE 'whatsapp_%'
ORDER BY config_key;
