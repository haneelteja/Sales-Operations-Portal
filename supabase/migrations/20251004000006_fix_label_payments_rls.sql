-- Fix RLS policies for label_payments table
-- Drop any existing policies first
DROP POLICY IF EXISTS "Allow public access for development" ON public.label_payments;

-- Disable RLS temporarily to ensure data access
ALTER TABLE public.label_payments DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.label_payments ENABLE ROW LEVEL SECURITY;

-- Create a more permissive policy for development
CREATE POLICY "Allow all operations for development"
  ON public.label_payments FOR ALL
  USING (true)
  WITH CHECK (true);

-- Also ensure label_vendors has proper RLS
DROP POLICY IF EXISTS "Allow public access for development" ON public.label_vendors;
ALTER TABLE public.label_vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.label_vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for development"
  ON public.label_vendors FOR ALL
  USING (true)
  WITH CHECK (true);







