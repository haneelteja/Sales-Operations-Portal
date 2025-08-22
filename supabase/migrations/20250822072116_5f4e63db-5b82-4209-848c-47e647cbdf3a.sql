-- Create customers table for Aamodha's clients
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  branch TEXT,
  sku TEXT,
  price_per_case DECIMAL(10,2),
  price_per_bottle DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create label vendors table
CREATE TABLE public.label_vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_name TEXT NOT NULL,
  label_type TEXT,
  price_per_label DECIMAL(10,4),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales transactions table (Client In/Out for Aamodha)
CREATE TABLE public.sales_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'payment')),
  amount DECIMAL(12,2) NOT NULL,
  quantity INTEGER,
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create factory payables table (Elma Industries)
CREATE TABLE public.factory_payables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('production', 'payment')),
  amount DECIMAL(12,2) NOT NULL,
  quantity INTEGER,
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transport expenses table
CREATE TABLE public.transport_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  expense_group TEXT,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create label purchases table
CREATE TABLE public.label_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES public.label_vendors(id) NOT NULL,
  quantity INTEGER NOT NULL,
  cost_per_label DECIMAL(10,4) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create label design costs table
CREATE TABLE public.label_design_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) NOT NULL,
  design_description TEXT NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  design_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create adjustments table
CREATE TABLE public.adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  adjustment_type TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  adjustment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (we'll set policies later when auth is implemented)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.label_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factory_payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.label_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.label_design_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjustments ENABLE ROW LEVEL SECURITY;

-- For now, allow public access until authentication is implemented
CREATE POLICY "Allow public access on customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Allow public access on label_vendors" ON public.label_vendors FOR ALL USING (true);
CREATE POLICY "Allow public access on sales_transactions" ON public.sales_transactions FOR ALL USING (true);
CREATE POLICY "Allow public access on factory_payables" ON public.factory_payables FOR ALL USING (true);
CREATE POLICY "Allow public access on transport_expenses" ON public.transport_expenses FOR ALL USING (true);
CREATE POLICY "Allow public access on label_purchases" ON public.label_purchases FOR ALL USING (true);
CREATE POLICY "Allow public access on label_design_costs" ON public.label_design_costs FOR ALL USING (true);
CREATE POLICY "Allow public access on adjustments" ON public.adjustments FOR ALL USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_label_vendors_updated_at
BEFORE UPDATE ON public.label_vendors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_transactions_updated_at
BEFORE UPDATE ON public.sales_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_factory_payables_updated_at
BEFORE UPDATE ON public.factory_payables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transport_expenses_updated_at
BEFORE UPDATE ON public.transport_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_label_purchases_updated_at
BEFORE UPDATE ON public.label_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_label_design_costs_updated_at
BEFORE UPDATE ON public.label_design_costs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_adjustments_updated_at
BEFORE UPDATE ON public.adjustments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();