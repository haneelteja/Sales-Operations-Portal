-- Add total_amount column to sales_transactions table
-- This column is required but was missing from the original table definition

-- Add total_amount column to sales_transactions table
ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS total_amount DECIMAL(12,2);

-- Set total_amount to equal amount for existing records
UPDATE sales_transactions 
SET total_amount = amount 
WHERE total_amount IS NULL;

-- Make total_amount NOT NULL after setting values
ALTER TABLE sales_transactions ALTER COLUMN total_amount SET NOT NULL;
