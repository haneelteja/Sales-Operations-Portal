-- CRITICAL SECURITY FIX: Remove public access and implement proper authentication

-- Step 1: Drop all existing public access policies
DROP POLICY IF EXISTS "Allow public access on adjustments" ON public.adjustments;
DROP POLICY IF EXISTS "Allow public access on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow public access on factory_payables" ON public.factory_payables;
DROP POLICY IF EXISTS "Allow public access on factory_pricing" ON public.factory_pricing;
DROP POLICY IF EXISTS "Allow public access on label_design_costs" ON public.label_design_costs;
DROP POLICY IF EXISTS "Allow public access on label_purchases" ON public.label_purchases;
DROP POLICY IF EXISTS "Allow public access on label_vendors" ON public.label_vendors;
DROP POLICY IF EXISTS "Allow public access on sales_transactions" ON public.sales_transactions;
DROP POLICY IF EXISTS "Allow public access on sku_configurations" ON public.sku_configurations;
DROP POLICY IF EXISTS "Allow public access on transport_expenses" ON public.transport_expenses;

-- Step 2: Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'employee', 'viewer');

-- Step 3: Create profiles table with roles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role app_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Step 5: Create function to check if user has minimum role
CREATE OR REPLACE FUNCTION public.has_role_or_higher(user_id UUID, required_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE 
    WHEN required_role = 'viewer' THEN get_user_role(user_id) IN ('viewer', 'employee', 'manager', 'admin')
    WHEN required_role = 'employee' THEN get_user_role(user_id) IN ('employee', 'manager', 'admin')
    WHEN required_role = 'manager' THEN get_user_role(user_id) IN ('manager', 'admin')
    WHEN required_role = 'admin' THEN get_user_role(user_id) = 'admin'
    ELSE false
  END;
$$;

-- Step 6: Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'employee'::app_role
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Profiles table policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (has_role_or_higher(auth.uid(), 'admin'));

-- Step 8: Implement secure RLS policies for all business tables

-- Customers: Employee level access required
CREATE POLICY "Authenticated users can view customers"
  ON public.customers FOR SELECT
  USING (has_role_or_higher(auth.uid(), 'employee'));

CREATE POLICY "Employees can manage customers"
  ON public.customers FOR ALL
  USING (has_role_or_higher(auth.uid(), 'employee'));

-- Sales Transactions: Employee level access required
CREATE POLICY "Authenticated users can view sales"
  ON public.sales_transactions FOR SELECT
  USING (has_role_or_higher(auth.uid(), 'employee'));

CREATE POLICY "Employees can manage sales"
  ON public.sales_transactions FOR ALL
  USING (has_role_or_higher(auth.uid(), 'employee'));

-- Factory Payables: Manager level access required (sensitive cost data)
CREATE POLICY "Managers can view factory payables"
  ON public.factory_payables FOR SELECT
  USING (has_role_or_higher(auth.uid(), 'manager'));

CREATE POLICY "Managers can manage factory payables"
  ON public.factory_payables FOR ALL
  USING (has_role_or_higher(auth.uid(), 'manager'));

-- Factory Pricing: Manager level access required (sensitive cost data)
CREATE POLICY "Managers can view factory pricing"
  ON public.factory_pricing FOR SELECT
  USING (has_role_or_higher(auth.uid(), 'manager'));

CREATE POLICY "Managers can manage factory pricing"
  ON public.factory_pricing FOR ALL
  USING (has_role_or_higher(auth.uid(), 'manager'));

-- SKU Configurations: Manager level access required
CREATE POLICY "Managers can view sku configurations"
  ON public.sku_configurations FOR SELECT
  USING (has_role_or_higher(auth.uid(), 'manager'));

CREATE POLICY "Managers can manage sku configurations"
  ON public.sku_configurations FOR ALL
  USING (has_role_or_higher(auth.uid(), 'manager'));

-- Transport Expenses: Employee level access required
CREATE POLICY "Employees can view transport expenses"
  ON public.transport_expenses FOR SELECT
  USING (has_role_or_higher(auth.uid(), 'employee'));

CREATE POLICY "Employees can manage transport expenses"
  ON public.transport_expenses FOR ALL
  USING (has_role_or_higher(auth.uid(), 'employee'));

-- Label Design Costs: Employee level access required
CREATE POLICY "Employees can view label design costs"
  ON public.label_design_costs FOR SELECT
  USING (has_role_or_higher(auth.uid(), 'employee'));

CREATE POLICY "Employees can manage label design costs"
  ON public.label_design_costs FOR ALL
  USING (has_role_or_higher(auth.uid(), 'employee'));

-- Label Purchases: Employee level access required
CREATE POLICY "Employees can view label purchases"
  ON public.label_purchases FOR SELECT
  USING (has_role_or_higher(auth.uid(), 'employee'));

CREATE POLICY "Employees can manage label purchases"
  ON public.label_purchases FOR ALL
  USING (has_role_or_higher(auth.uid(), 'employee'));

-- Label Vendors: Employee level access required
CREATE POLICY "Employees can view label vendors"
  ON public.label_vendors FOR SELECT
  USING (has_role_or_higher(auth.uid(), 'employee'));

CREATE POLICY "Employees can manage label vendors"
  ON public.label_vendors FOR ALL
  USING (has_role_or_higher(auth.uid(), 'employee'));

-- Adjustments: Manager level access required (financial adjustments)
CREATE POLICY "Managers can view adjustments"
  ON public.adjustments FOR SELECT
  USING (has_role_or_higher(auth.uid(), 'manager'));

CREATE POLICY "Managers can manage adjustments"
  ON public.adjustments FOR ALL
  USING (has_role_or_higher(auth.uid(), 'manager'));

-- Step 9: Add updated_at triggers for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();