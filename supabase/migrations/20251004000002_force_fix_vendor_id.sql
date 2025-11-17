-- Force fix vendor_id column type - drop and recreate as TEXT
-- This migration forcefully changes the vendor_id column from UUID to TEXT

-- First, drop any foreign key constraints
ALTER TABLE public.label_purchases DROP CONSTRAINT IF EXISTS fk_label_purchases_vendor;
ALTER TABLE public.label_purchases DROP CONSTRAINT IF EXISTS label_purchases_vendor_id_fkey;

-- Drop the existing column completely
ALTER TABLE public.label_purchases DROP COLUMN IF EXISTS vendor_id;

-- Add the new column as TEXT
ALTER TABLE public.label_purchases ADD COLUMN vendor_id TEXT NOT NULL DEFAULT '';

-- Remove the default after adding the column
ALTER TABLE public.label_purchases ALTER COLUMN vendor_id DROP DEFAULT;

-- Add a comment to clarify the purpose
COMMENT ON COLUMN public.label_purchases.vendor_id IS 'Vendor name as text (not UUID)';







