-- Add SKU field to factory_payables table to link with factory_pricing
ALTER TABLE public.factory_payables 
ADD COLUMN sku text;

-- Add an index for better performance when joining with factory_pricing
CREATE INDEX idx_factory_payables_sku ON public.factory_payables(sku);