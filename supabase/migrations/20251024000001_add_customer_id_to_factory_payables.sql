-- Add customer_id column to factory_payables table
-- This column is needed for linking factory payables to customers

-- Add customer_id column
ALTER TABLE public.factory_payables 
ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE CASCADE;

-- Add an index for better performance when joining with customers
CREATE INDEX idx_factory_payables_customer_id ON public.factory_payables(customer_id);

-- Add a comment to clarify the purpose
COMMENT ON COLUMN public.factory_payables.customer_id IS 'Reference to customers table for linking factory payables to specific customers';
