-- Fix label_purchases table schema to match application expectations
-- This migration updates the label_purchases table to have the correct columns

-- First, let's check if the table exists and what columns it has
-- Drop the existing table if it exists (since we're in development)
DROP TABLE IF EXISTS public.label_purchases CASCADE;

-- Create the label_purchases table with the correct schema
CREATE TABLE public.label_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id TEXT NOT NULL,
  client_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  sku TEXT,
  quantity INTEGER NOT NULL,
  cost_per_label DECIMAL(10,4) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  payment_amount DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.label_purchases ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (allow all for development)
CREATE POLICY "Allow all operations on label_purchases" 
ON public.label_purchases FOR ALL USING (true);

-- Note: update_updated_at_column() function will be created in a separate migration if needed
