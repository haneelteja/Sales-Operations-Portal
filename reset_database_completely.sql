-- Complete Database Reset and Clean Setup
-- This will create a clean, working database every time

-- Drop all existing tables (in correct order to avoid foreign key constraints)
DROP TABLE IF EXISTS label_payments CASCADE;
DROP TABLE IF EXISTS label_purchases CASCADE;
DROP TABLE IF EXISTS label_availabilities CASCADE;
DROP TABLE IF EXISTS transport_expenses CASCADE;
DROP TABLE IF EXISTS factory_payables CASCADE;
DROP TABLE IF EXISTS sales_transactions CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS sku_configurations CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS user_management CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS label_vendors CASCADE;
DROP TABLE IF EXISTS factory_pricing CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS user_has_data_access() CASCADE;

-- Create profiles table (simplified)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_management table (simplified, no RLS)
CREATE TABLE user_management (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  associated_clients TEXT[] DEFAULT '{}',
  associated_branches TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'manager', 'client')),
  created_by UUID REFERENCES auth.users(id),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table (simplified, no RLS)
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  branch TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  sku TEXT,
  price_per_case DECIMAL(10,2),
  price_per_bottle DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sku_configurations table
CREATE TABLE sku_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  bottles_per_case INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales_transactions table (simplified, no RLS)
CREATE TABLE sales_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'payment')),
  amount DECIMAL(10,2) NOT NULL,
  quantity INTEGER,
  sku TEXT,
  description TEXT,
  branch TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create factory_payables table
CREATE TABLE factory_payables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type TEXT NOT NULL,
  sku TEXT,
  amount DECIMAL(10,2) NOT NULL,
  quantity INTEGER,
  description TEXT,
  transaction_date DATE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transport_expenses table
CREATE TABLE transport_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL,
  expense_group TEXT,
  client_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  client_name TEXT,
  branch TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create label_purchases table
CREATE TABLE label_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  purchase_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create label_payments table
CREATE TABLE label_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID REFERENCES label_purchases(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  order_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create label_availabilities table
CREATE TABLE label_availabilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  sku TEXT,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create label_vendors table
CREATE TABLE label_vendors (
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
CREATE TABLE factory_pricing (
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

-- Insert sample data
INSERT INTO sku_configurations (sku, bottles_per_case) VALUES 
('P 500 ML', 20),
('P 1000 ML', 12),
('Element E7', 24);

INSERT INTO label_vendors (vendor_name, contact_person, phone, email) VALUES 
('Sample Vendor 1', 'John Doe', '1234567890', 'john@vendor1.com'),
('Sample Vendor 2', 'Jane Smith', '0987654321', 'jane@vendor2.com');

INSERT INTO factory_pricing (sku, bottles_per_case, price_per_case, price_per_bottle) VALUES 
('P 500 ML', 20, 100.00, 5.00),
('P 1000 ML', 12, 120.00, 10.00),
('Element E7', 24, 240.00, 10.00);

-- Insert sample customer
INSERT INTO customers (client_name, branch, contact_person, phone, email, sku, price_per_case, is_active) VALUES 
('Sample Client', 'Main Branch', 'John Doe', '1234567890', 'john@sample.com', 'P 500 ML', 150.00, true);

-- Insert sample user management record
INSERT INTO user_management (user_id, username, email, associated_clients, associated_branches, status, role) VALUES 
('522e3037-0b9f-4c19-b936-368f9f65a49b', 'nalluruhaneel@gmail.com', 'nalluruhaneel@gmail.com', '{}', '{}', 'active', 'client');

-- NO RLS POLICIES - Keep it simple and working





