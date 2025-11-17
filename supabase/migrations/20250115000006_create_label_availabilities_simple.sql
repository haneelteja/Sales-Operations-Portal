-- Create label_availabilities table (simplified version)
CREATE TABLE IF NOT EXISTS public.label_availabilities (
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

-- Create simple RLS policies (allow all for now)
CREATE POLICY "Allow all operations on label_availabilities" ON public.label_availabilities FOR ALL USING (true);





