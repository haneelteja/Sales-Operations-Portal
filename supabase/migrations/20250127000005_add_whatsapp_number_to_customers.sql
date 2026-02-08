-- ==============================================
-- ADD WHATSAPP_NUMBER COLUMN TO CUSTOMERS TABLE
-- ==============================================
-- Adds whatsapp_number column for WhatsApp integration
-- Date: 2025-01-27
-- ==============================================

-- Add whatsapp_number column to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);

-- Add comment for documentation
COMMENT ON COLUMN customers.whatsapp_number IS 'WhatsApp number for customer (format: +[country code][number], e.g., +919876543210)';

-- Create index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp_number 
ON customers(whatsapp_number) 
WHERE whatsapp_number IS NOT NULL;
