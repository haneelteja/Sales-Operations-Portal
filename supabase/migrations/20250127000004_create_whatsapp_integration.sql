-- ==============================================
-- WHATSAPP INTEGRATION - DATABASE SCHEMA
-- ==============================================
-- Creates tables and configurations for 360Messenger WhatsApp integration
-- Date: 2025-01-27
-- ==============================================

-- Create WhatsApp Message Logs Table
CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  whatsapp_number VARCHAR(20) NOT NULL,
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('stock_delivered', 'invoice', 'payment_reminder', 'festival')),
  trigger_type VARCHAR(20) NOT NULL CHECK (trigger_type IN ('auto', 'scheduled', 'manual')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  message_content TEXT,
  template_id UUID,
  attachment_url TEXT,
  attachment_type VARCHAR(50),
  failure_reason TEXT,
  api_response JSONB,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create WhatsApp Templates Table
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(100) NOT NULL UNIQUE,
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('stock_delivered', 'invoice', 'payment_reminder', 'festival')),
  template_content TEXT NOT NULL,
  placeholders TEXT[], -- Array of placeholder names like ['customerName', 'invoiceNumber']
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- One default template per message type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_customer ON whatsapp_message_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status ON whatsapp_message_logs(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_type ON whatsapp_message_logs(message_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_scheduled ON whatsapp_message_logs(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at ON whatsapp_message_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_type ON whatsapp_templates(message_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_active ON whatsapp_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_default ON whatsapp_templates(message_type, is_default) WHERE is_default = true;

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS trigger_update_whatsapp_logs_updated_at ON whatsapp_message_logs;
CREATE TRIGGER trigger_update_whatsapp_logs_updated_at
  BEFORE UPDATE ON whatsapp_message_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_whatsapp_templates_updated_at ON whatsapp_templates;
CREATE TRIGGER trigger_update_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE whatsapp_message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_message_logs
-- Managers and admins can view all logs
CREATE POLICY "Managers can view WhatsApp logs"
  ON whatsapp_message_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_management
      WHERE user_management.user_id = auth.uid()
      AND user_management.role IN ('manager', 'admin')
      AND user_management.status = 'active'
    )
  );

-- Service role can insert/update (for Edge Functions)
CREATE POLICY "Service role can manage WhatsApp logs"
  ON whatsapp_message_logs FOR ALL
  USING (auth.role() = 'service_role');

-- Authenticated managers can insert manual messages
CREATE POLICY "Managers can insert manual WhatsApp logs"
  ON whatsapp_message_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_management
      WHERE user_management.user_id = auth.uid()
      AND user_management.role IN ('manager', 'admin')
      AND user_management.status = 'active'
    )
    AND trigger_type = 'manual'
  );

-- RLS Policies for whatsapp_templates
-- Managers and admins can manage templates
CREATE POLICY "Managers can manage WhatsApp templates"
  ON whatsapp_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_management
      WHERE user_management.user_id = auth.uid()
      AND user_management.role IN ('manager', 'admin')
      AND user_management.status = 'active'
    )
  );

-- Service role can read templates (for Edge Functions)
CREATE POLICY "Service role can read templates"
  ON whatsapp_templates FOR SELECT
  USING (auth.role() = 'service_role');

-- Insert default WhatsApp configuration entries
INSERT INTO invoice_configurations (config_key, config_value, config_type, description) VALUES
  ('whatsapp_enabled', 'false', 'boolean', 'Enable WhatsApp messaging integration'),
  ('whatsapp_stock_delivered_enabled', 'false', 'boolean', 'Enable stock delivered notifications via WhatsApp'),
  ('whatsapp_invoice_enabled', 'false', 'boolean', 'Enable invoice messages via WhatsApp'),
  ('whatsapp_payment_reminder_enabled', 'false', 'boolean', 'Enable payment reminder messages via WhatsApp'),
  ('whatsapp_festival_enabled', 'false', 'boolean', 'Enable festival/salutation messages via WhatsApp'),
  ('whatsapp_api_key', '', 'string', '360Messenger API Key (stored securely)'),
  ('whatsapp_api_url', 'https://api.360messenger.com', 'string', '360Messenger API Base URL'),
  ('whatsapp_retry_max', '3', 'number', 'Maximum retry attempts for failed messages'),
  ('whatsapp_retry_interval_minutes', '30', 'number', 'Retry interval in minutes between attempts'),
  ('whatsapp_failure_notification_email', 'pega2023test@gmail.com', 'string', 'Email address for WhatsApp failure notifications'),
  ('whatsapp_payment_reminder_days', '3,7', 'string', 'Days after invoice date to send payment reminders (comma-separated)')
ON CONFLICT (config_key) DO NOTHING;

-- Insert default templates
INSERT INTO whatsapp_templates (template_name, message_type, template_content, placeholders, is_default) VALUES
  (
    'Stock Delivered - Default',
    'stock_delivered',
    'Hello {customerName}, Your order {orderNumber} has been delivered on {deliveryDate}. Items: {items}. Thank you!',
    ARRAY['customerName', 'orderNumber', 'deliveryDate', 'items'],
    true
  ),
  (
    'Invoice - Default',
    'invoice',
    'Dear {customerName}, Your invoice {invoiceNumber} dated {invoiceDate} for ₹{amount} is ready. Due Date: {dueDate}. View: {invoiceLink}. Thank you!',
    ARRAY['customerName', 'invoiceNumber', 'invoiceDate', 'amount', 'dueDate', 'invoiceLink'],
    true
  ),
  (
    'Payment Reminder - Default',
    'payment_reminder',
    'Hello {customerName}, Reminder: Invoice {invoiceNumber} for ₹{amount} is {daysOverdue} days overdue. Due Date: {dueDate}. Please pay at your earliest convenience. Thank you!',
    ARRAY['customerName', 'invoiceNumber', 'amount', 'daysOverdue', 'dueDate'],
    true
  ),
  (
    'Festival - Default',
    'festival',
    'Dear {customerName}, Wishing you a happy {festivalName}! Thank you for your continued support.',
    ARRAY['customerName', 'festivalName'],
    true
  )
ON CONFLICT (template_name) DO NOTHING;

-- Add comment to tables
COMMENT ON TABLE whatsapp_message_logs IS 'Logs all WhatsApp messages sent via 360Messenger API';
COMMENT ON TABLE whatsapp_templates IS 'Stores WhatsApp message templates with placeholders';

COMMENT ON COLUMN whatsapp_message_logs.message_type IS 'Type: stock_delivered, invoice, payment_reminder, festival';
COMMENT ON COLUMN whatsapp_message_logs.trigger_type IS 'Trigger: auto (system), scheduled (cron), manual (user)';
COMMENT ON COLUMN whatsapp_message_logs.status IS 'Status: pending, sent, failed';
COMMENT ON COLUMN whatsapp_templates.placeholders IS 'Array of placeholder names used in template';
