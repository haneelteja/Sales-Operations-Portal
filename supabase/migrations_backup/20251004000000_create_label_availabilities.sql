-- Create label_availabilities table to track available labels
CREATE TABLE public.label_availabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.customers(id),
  sku TEXT,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.label_availabilities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Employees can view label availabilities"
  ON public.label_availabilities FOR SELECT
  USING (has_role_or_higher(auth.uid(), 'employee'));

CREATE POLICY "Employees can manage label availabilities"
  ON public.label_availabilities FOR ALL
  USING (has_role_or_higher(auth.uid(), 'employee'));

-- Add update trigger
CREATE TRIGGER update_label_availabilities_updated_at
BEFORE UPDATE ON public.label_availabilities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();



