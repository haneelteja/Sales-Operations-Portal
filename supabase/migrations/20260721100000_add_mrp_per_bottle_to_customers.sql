-- Add MRP per bottle to customers table
-- MRP is per client+branch (same value across all SKU rows), synced like gst_number/whatsapp_number.
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS mrp_per_bottle DECIMAL(10,2);
