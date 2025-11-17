-- Safe Database Setup for Elma Operations Portal
-- This version handles existing tables gracefully

-- ==============================================
-- 1. CORE TABLES
-- ==============================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_management table
CREATE TABLE IF NOT EXISTS user_management (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  associated_clients TEXT[] DEFAULT '{}',
  associated_branches TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active',
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'client')),
  created_by UUID,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  branch TEXT,
  sku TEXT,
  price_per_case DECIMAL(10,2),
  price_per_bottle DECIMAL(10,2),
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_name, branch)
);

-- Create sku_configurations table
CREATE TABLE IF NOT EXISTS sku_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  bottles_per_case INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. TRANSACTION TABLES
-- ==============================================

-- Create sales_transactions table
CREATE TABLE IF NOT EXISTS sales_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'payment')),
  amount DECIMAL(12,2) NOT NULL,
  quantity INTEGER,
  sku TEXT,
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create factory_payables table
CREATE TABLE IF NOT EXISTS factory_payables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('production', 'payment')),
  amount DECIMAL(12,2) NOT NULL,
  quantity INTEGER,
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transport_expenses table
CREATE TABLE IF NOT EXISTS transport_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_group TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 3. LABEL MANAGEMENT TABLES
-- ==============================================

-- Create label_vendors table
CREATE TABLE IF NOT EXISTS label_vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_name TEXT NOT NULL,
  label_type TEXT,
  price_per_label DECIMAL(10,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create label_purchases table
CREATE TABLE IF NOT EXISTS label_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  vendor TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price_per_label DECIMAL(10,4) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create label_payments table
CREATE TABLE IF NOT EXISTS label_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor TEXT NOT NULL,
  payment_amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'Bank Transfer', 'UPI')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 4. ORDER MANAGEMENT TABLES
-- ==============================================

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client TEXT NOT NULL,
  branch TEXT NOT NULL,
  sku TEXT NOT NULL,
  number_of_cases INTEGER NOT NULL,
  tentative_delivery_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dispatched', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 5. FACTORY PRICING TABLE
-- ==============================================

-- Create factory_pricing table
CREATE TABLE IF NOT EXISTS factory_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL,
  price_per_case DECIMAL(10,2) NOT NULL,
  pricing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 6. ENABLE RLS ON ALL TABLES (EXCEPT user_management)
-- ==============================================

-- Enable RLS on all tables except user_management
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'customers' AND schemaname = 'public') THEN
    ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'sku_configurations' AND schemaname = 'public') THEN
    ALTER TABLE sku_configurations ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'sales_transactions' AND schemaname = 'public') THEN
    ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'factory_payables' AND schemaname = 'public') THEN
    ALTER TABLE factory_payables ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'transport_expenses' AND schemaname = 'public') THEN
    ALTER TABLE transport_expenses ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'label_vendors' AND schemaname = 'public') THEN
    ALTER TABLE label_vendors ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'label_purchases' AND schemaname = 'public') THEN
    ALTER TABLE label_purchases ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'label_payments' AND schemaname = 'public') THEN
    ALTER TABLE label_payments ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'orders' AND schemaname = 'public') THEN
    ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'factory_pricing' AND schemaname = 'public') THEN
    ALTER TABLE factory_pricing ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ==============================================
-- 7. CREATE RLS POLICIES (IF NOT EXISTS)
-- ==============================================

-- Create policies only if they don't exist
DO $$ 
BEGIN
  -- Profiles policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow all operations on profiles') THEN
    CREATE POLICY "Allow all operations on profiles" ON profiles FOR ALL USING (auth.role() = 'authenticated');
  END IF;
  
  -- Customers policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Allow all operations on customers') THEN
    CREATE POLICY "Allow all operations on customers" ON customers FOR ALL USING (auth.role() = 'authenticated');
  END IF;
  
  -- SKU configurations policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sku_configurations' AND policyname = 'Allow all operations on sku_configurations') THEN
    CREATE POLICY "Allow all operations on sku_configurations" ON sku_configurations FOR ALL USING (auth.role() = 'authenticated');
  END IF;
  
  -- Sales transactions policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales_transactions' AND policyname = 'Allow all operations on sales_transactions') THEN
    CREATE POLICY "Allow all operations on sales_transactions" ON sales_transactions FOR ALL USING (auth.role() = 'authenticated');
  END IF;
  
  -- Factory payables policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'factory_payables' AND policyname = 'Allow all operations on factory_payables') THEN
    CREATE POLICY "Allow all operations on factory_payables" ON factory_payables FOR ALL USING (auth.role() = 'authenticated');
  END IF;
  
  -- Transport expenses policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transport_expenses' AND policyname = 'Allow all operations on transport_expenses') THEN
    CREATE POLICY "Allow all operations on transport_expenses" ON transport_expenses FOR ALL USING (auth.role() = 'authenticated');
  END IF;
  
  -- Label vendors policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'label_vendors' AND policyname = 'Allow all operations on label_vendors') THEN
    CREATE POLICY "Allow all operations on label_vendors" ON label_vendors FOR ALL USING (auth.role() = 'authenticated');
  END IF;
  
  -- Label purchases policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'label_purchases' AND policyname = 'Allow all operations on label_purchases') THEN
    CREATE POLICY "Allow all operations on label_purchases" ON label_purchases FOR ALL USING (auth.role() = 'authenticated');
  END IF;
  
  -- Label payments policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'label_payments' AND policyname = 'Allow all operations on label_payments') THEN
    CREATE POLICY "Allow all operations on label_payments" ON label_payments FOR ALL USING (auth.role() = 'authenticated');
  END IF;
  
  -- Orders policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Allow all operations on orders') THEN
    CREATE POLICY "Allow all operations on orders" ON orders FOR ALL USING (auth.role() = 'authenticated');
  END IF;
  
  -- Factory pricing policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'factory_pricing' AND policyname = 'Allow all operations on factory_pricing') THEN
    CREATE POLICY "Allow all operations on factory_pricing" ON factory_pricing FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ==============================================
-- 8. INSERT SAMPLE DATA (SAFELY)
-- ==============================================

-- Insert sample SKU configurations (only if they don't exist)
INSERT INTO sku_configurations (sku, bottles_per_case) 
SELECT 'P 500 ML', 20
WHERE NOT EXISTS (SELECT 1 FROM sku_configurations WHERE sku = 'P 500 ML');

INSERT INTO sku_configurations (sku, bottles_per_case) 
SELECT 'P 1000 ML', 12
WHERE NOT EXISTS (SELECT 1 FROM sku_configurations WHERE sku = 'P 1000 ML');

INSERT INTO sku_configurations (sku, bottles_per_case) 
SELECT 'P 250 ML', 24
WHERE NOT EXISTS (SELECT 1 FROM sku_configurations WHERE sku = 'P 250 ML');

-- Insert sample customers (only if they don't exist)
INSERT INTO customers (client_name, branch, sku, price_per_case, price_per_bottle) 
SELECT 'Benguluru Bhavan', 'Gachibowli', 'P 500 ML', 1200.00, 60.00
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE client_name = 'Benguluru Bhavan' AND branch = 'Gachibowli');

INSERT INTO customers (client_name, branch, sku, price_per_case, price_per_bottle) 
SELECT 'Benguluru Bhavan', 'kondapur', 'P 1000 ML', 1800.00, 150.00
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE client_name = 'Benguluru Bhavan' AND branch = 'kondapur');

INSERT INTO customers (client_name, branch, sku, price_per_case, price_per_bottle) 
SELECT 'Biryanis and more', 'Kukatpally', 'P 500 ML', 1100.00, 55.00
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE client_name = 'Biryanis and more' AND branch = 'Kukatpally');

INSERT INTO customers (client_name, branch, sku, price_per_case, price_per_bottle) 
SELECT 'Element E7', 'Main Branch', 'P 250 ML', 800.00, 33.33
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE client_name = 'Element E7' AND branch = 'Main Branch');

-- Insert sample factory pricing (only if they don't exist)
INSERT INTO factory_pricing (sku, price_per_case) 
SELECT 'P 500 ML', 1000.00
WHERE NOT EXISTS (SELECT 1 FROM factory_pricing WHERE sku = 'P 500 ML');

INSERT INTO factory_pricing (sku, price_per_case) 
SELECT 'P 1000 ML', 1500.00
WHERE NOT EXISTS (SELECT 1 FROM factory_pricing WHERE sku = 'P 1000 ML');

INSERT INTO factory_pricing (sku, price_per_case) 
SELECT 'P 250 ML', 700.00
WHERE NOT EXISTS (SELECT 1 FROM factory_pricing WHERE sku = 'P 250 ML');

-- ==============================================
-- 9. VERIFY SETUP
-- ==============================================

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'profiles', 'user_management', 'customers', 'sku_configurations',
  'sales_transactions', 'factory_payables', 'transport_expenses',
  'label_vendors', 'label_purchases', 'label_payments', 'orders', 'factory_pricing'
)
ORDER BY table_name;






