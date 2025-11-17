-- Update existing tables and add new configurations

-- Add new fields to transport_expenses table
ALTER TABLE transport_expenses 
ADD COLUMN client_id uuid,
ADD COLUMN branch text;

-- Add new fields to label_purchases table  
ALTER TABLE label_purchases
ADD COLUMN client_id uuid,
ADD COLUMN sku text,
ADD COLUMN payment_amount numeric;

-- Add new fields to sales_transactions table
ALTER TABLE sales_transactions
ADD COLUMN branch text,
ADD COLUMN sku text;

-- Create new sku_configurations table
CREATE TABLE sku_configurations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sku text NOT NULL UNIQUE,
  bottles_per_case integer NOT NULL,
  cost_per_bottle numeric NOT NULL,
  cost_per_case numeric GENERATED ALWAYS AS (cost_per_bottle * bottles_per_case) STORED,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create new factory_pricing table
CREATE TABLE factory_pricing (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pricing_date date NOT NULL DEFAULT CURRENT_DATE,
  sku text NOT NULL,
  price_per_bottle numeric NOT NULL,
  tax numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE sku_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_pricing ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Allow public access on sku_configurations" 
ON sku_configurations FOR ALL USING (true);

CREATE POLICY "Allow public access on factory_pricing" 
ON factory_pricing FOR ALL USING (true);

-- Add update triggers for new tables
CREATE TRIGGER update_sku_configurations_updated_at
BEFORE UPDATE ON sku_configurations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_factory_pricing_updated_at
BEFORE UPDATE ON factory_pricing
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();