-- ==============================================
-- SAFE FIX FOR FACTORY_PRICING TABLE
-- This version checks for existing data first
-- Run this in Supabase SQL Editor
-- ==============================================

-- Step 1: Check current data (run this first to see what we're working with)
-- Only select columns that exist
SELECT 
    id,
    sku,
    price_per_case,
    pricing_date,
    created_at
FROM public.factory_pricing
LIMIT 10;

-- Step 2: Add missing columns (safe - won't fail if they exist)
ALTER TABLE public.factory_pricing
  ADD COLUMN IF NOT EXISTS bottles_per_case INTEGER,
  ADD COLUMN IF NOT EXISTS price_per_bottle NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS tax NUMERIC(10,2);

-- Step 3: Set default values for bottles_per_case first
UPDATE public.factory_pricing
SET bottles_per_case = 12
WHERE bottles_per_case IS NULL;

-- Step 4: Migrate existing data from price_per_case to price_per_bottle
-- Only update rows where price_per_bottle is NULL and price_per_case exists
UPDATE public.factory_pricing
SET price_per_bottle = price_per_case / NULLIF(bottles_per_case, 0)
WHERE price_per_bottle IS NULL 
  AND price_per_case IS NOT NULL
  AND price_per_case > 0
  AND bottles_per_case > 0;

-- Step 5: Set defaults for any remaining NULL values
UPDATE public.factory_pricing
SET bottles_per_case = 12
WHERE bottles_per_case IS NULL;

UPDATE public.factory_pricing
SET price_per_bottle = 0
WHERE price_per_bottle IS NULL;

-- Step 6: Add NOT NULL constraints with defaults
ALTER TABLE public.factory_pricing
  ALTER COLUMN bottles_per_case SET DEFAULT 12,
  ALTER COLUMN bottles_per_case SET NOT NULL;

ALTER TABLE public.factory_pricing
  ALTER COLUMN price_per_bottle SET NOT NULL;

-- Step 7: Add generated cost_per_case column
-- Drop if exists (in case it was created incorrectly before)
ALTER TABLE public.factory_pricing
  DROP COLUMN IF EXISTS cost_per_case;

-- Create as generated column (automatically calculated)
ALTER TABLE public.factory_pricing
  ADD COLUMN cost_per_case NUMERIC(10,2) 
  GENERATED ALWAYS AS (price_per_bottle * bottles_per_case) STORED;

-- Step 8: Fix RLS Policy to allow both authenticated and anon users
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Allow all operations on factory_pricing" ON public.factory_pricing;

-- Create new policy that allows all operations (for development)
-- NOTE: For production, you may want to restrict this further
CREATE POLICY "Allow all operations on factory_pricing" 
ON public.factory_pricing 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Step 9: Verify the structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN is_generated = 'ALWAYS' THEN 'GENERATED'
        ELSE 'REGULAR'
    END as column_type,
    generation_expression
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'factory_pricing'
ORDER BY ordinal_position;

-- Step 10: Test the application query
SELECT 
    sku, 
    bottles_per_case
FROM public.factory_pricing
ORDER BY sku ASC;

-- Step 11: Verify RLS policies
SELECT 
    policyname,
    cmd as command,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'factory_pricing';

