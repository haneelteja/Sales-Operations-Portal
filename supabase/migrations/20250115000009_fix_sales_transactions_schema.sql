-- Fix sales_transactions table schema
-- Add missing columns that the application expects

-- Add missing columns to sales_transactions table
ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT;
ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);
ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing records to have default values
UPDATE sales_transactions 
SET 
    transaction_type = 'sale',
    amount = total_amount,
    description = 'Sales transaction'
WHERE transaction_type IS NULL OR amount IS NULL;





