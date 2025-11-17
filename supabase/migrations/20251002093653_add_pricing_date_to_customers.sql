-- Add pricing_date column to customers table
ALTER TABLE customers 
ADD COLUMN pricing_date DATE;

-- Add a comment to explain the purpose of this column
COMMENT ON COLUMN customers.pricing_date IS 'Date when the pricing was set for this customer, used to calculate latest prices';








