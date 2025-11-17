-- Fix RLS policies for label_purchases table to allow public access for development
-- This migration restores public access to label_purchases table

-- Drop the existing employee-only policies
DROP POLICY IF EXISTS "Employees can view label purchases" ON public.label_purchases;
DROP POLICY IF EXISTS "Employees can manage label purchases" ON public.label_purchases;

-- Create new public access policies for development
CREATE POLICY "Allow public access on label_purchases" 
ON public.label_purchases FOR ALL 
USING (true);

-- Add a comment explaining this is for development
COMMENT ON TABLE public.label_purchases IS 'Label purchases table - public access enabled for development';







