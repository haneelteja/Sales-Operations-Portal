-- ==============================================
-- FIX FACTORY_PRICING TABLE STRUCTURE
-- Run this in Supabase SQL Editor
-- ==============================================

-- Step 1: Add missing columns
-- Add bottles_per_case column (if it doesn't exist)
ALTER TABLE public.factory_pricing
  ADD COLUMN IF NOT EXISTS bottles_per_case INTEGER;

-- Add price_per_bottle column (if it doesn't exist)
ALTER TABLE public.factory_pricing
  ADD COLUMN IF NOT EXISTS price_per_bottle NUMERIC(10,2);

-- Add tax column (if it doesn't exist)
ALTER TABLE public.factory_pricing
  ADD COLUMN IF NOT EXISTS tax NUMERIC(10,2);

-- Step 2: Migrate existing data (if price_per_case exists, calculate price_per_bottle)
-- This assumes price_per_case exists and we need to derive price_per_bottle
-- You may need to adjust this based on your data
UPDATE public.factory_pricing
SET 
  bottles_per_case = COALESCE(bottles_per_case, 12), -- Default to 12 if null
  price_per_bottle = CASE 
    WHEN bottles_per_case IS NOT NULL AND bottles_per_case > 0 
    THEN price_per_case / bottles_per_case 
    ELSE price_per_case / 12 -- Default calculation
  END
WHERE price_per_bottle IS NULL 
  AND price_per_case IS NOT NULL;

-- Step 3: Set NOT NULL constraints after data migration
-- First, ensure all rows have values
UPDATE public.factory_pricing
SET bottles_per_case = COALESCE(bottles_per_case, 12)
WHERE bottles_per_case IS NULL;

UPDATE public.factory_pricing
SET price_per_bottle = COALESCE(price_per_bottle, 0)
WHERE price_per_bottle IS NULL;

-- Now add NOT NULL constraints
ALTER TABLE public.factory_pricing
  ALTER COLUMN bottles_per_case SET NOT NULL,
  ALTER COLUMN bottles_per_case SET DEFAULT 12;

ALTER TABLE public.factory_pricing
  ALTER COLUMN price_per_bottle SET NOT NULL;

-- Step 4: Add generated cost_per_case column
-- Drop if exists first (in case it was created incorrectly)
ALTER TABLE public.factory_pricing
  DROP COLUMN IF EXISTS cost_per_case;

-- Create as generated column
ALTER TABLE public.factory_pricing
  ADD COLUMN cost_per_case NUMERIC(10,2) 
  GENERATED ALWAYS AS (price_per_bottle * bottles_per_case) STORED;

-- Step 5: Update RLS policy to allow both authenticated and anon access
-- Drop existing policy
DROP POLICY IF EXISTS "Allow all operations on factory_pricing" ON public.factory_pricing;

-- Create new policy that allows both authenticated and anon users
CREATE POLICY "Allow all operations on factory_pricing" 
ON public.factory_pricing 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Alternative: If you want to keep it restricted to authenticated users only:
-- CREATE POLICY "Allow all operations on factory_pricing" 
-- ON public.factory_pricing 
-- FOR ALL 
-- USING (auth.role() = 'authenticated'::text OR auth.role() = 'anon'::text)
-- WITH CHECK (auth.role() = 'authenticated'::text OR auth.role() = 'anon'::text);

-- Step 6: Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    is_generated,
    generation_expression
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'factory_pricing'
ORDER BY ordinal_position;

-- Step 7: Test query (should work now)
SELECT 
    sku, 
    bottles_per_case,
    price_per_bottle,
    cost_per_case
FROM public.factory_pricing
ORDER BY sku ASC
LIMIT 10;

