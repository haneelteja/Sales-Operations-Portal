-- Fix vendor_id column type issue - ensure it's TEXT
-- This migration ensures the vendor_id column is properly set to TEXT type

-- First, check if the column exists and what type it is
DO $$
BEGIN
    -- Drop any foreign key constraints that might exist
    ALTER TABLE public.label_purchases DROP CONSTRAINT IF EXISTS fk_label_purchases_vendor;
    ALTER TABLE public.label_purchases DROP CONSTRAINT IF EXISTS label_purchases_vendor_id_fkey;
    ALTER TABLE public.label_purchases DROP CONSTRAINT IF EXISTS label_purchases_vendor_id_fkey;
    
    -- Change the column type from UUID to TEXT using USING clause
    ALTER TABLE public.label_purchases ALTER COLUMN vendor_id TYPE TEXT USING vendor_id::TEXT;
    
    -- Make the column NOT NULL since we want to require vendor names
    ALTER TABLE public.label_purchases ALTER COLUMN vendor_id SET NOT NULL;
    
    RAISE NOTICE 'Successfully changed vendor_id column to TEXT type';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error changing vendor_id column: %', SQLERRM;
END $$;







