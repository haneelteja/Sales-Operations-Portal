-- Add is_active field to customers table for soft delete functionality
ALTER TABLE public.customers 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Add index for better performance on active customers
CREATE INDEX idx_customers_is_active ON public.customers(is_active);