-- Create missing tables that the application expects

-- Create label_vendors table
CREATE TABLE IF NOT EXISTS label_vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_name TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create factory_pricing table
CREATE TABLE IF NOT EXISTS factory_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL,
  bottles_per_case INTEGER NOT NULL,
  price_per_case DECIMAL(10,2) NOT NULL,
  price_per_bottle DECIMAL(10,2) NOT NULL,
  pricing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE label_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_pricing ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies (allow all for development)
CREATE POLICY "Allow all operations on label_vendors" ON label_vendors FOR ALL USING (true);
CREATE POLICY "Allow all operations on factory_pricing" ON factory_pricing FOR ALL USING (true);

-- Insert sample data
INSERT INTO label_vendors (vendor_name, contact_person, phone, email) VALUES 
('Sample Vendor 1', 'John Doe', '1234567890', 'john@vendor1.com'),
('Sample Vendor 2', 'Jane Smith', '0987654321', 'jane@vendor2.com')
ON CONFLICT (vendor_name) DO NOTHING;

INSERT INTO factory_pricing (sku, bottles_per_case, price_per_case, price_per_bottle) VALUES 
('P 500 ML', 20, 100.00, 5.00),
('P 1000 ML', 12, 120.00, 10.00),
('Element E7', 24, 240.00, 10.00)
ON CONFLICT DO NOTHING;





