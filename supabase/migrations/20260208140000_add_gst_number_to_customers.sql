-- Add gst_number to customers for dealer management (GSTIN 15-char validation in app)
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS gst_number VARCHAR(20);

COMMENT ON COLUMN customers.gst_number IS 'GSTIN (15 characters) for the dealer/customer';
