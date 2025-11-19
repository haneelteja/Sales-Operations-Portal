-- ==============================================
-- FIX FACTORY_PRICING TABLE - STEP BY STEP
-- Run each section separately in Supabase SQL Editor
-- ==============================================

-- ==============================================
-- SECTION 1: Add Missing Columns
-- Run this first
-- ==============================================
ALTER TABLE public.factory_pricing
  ADD COLUMN IF NOT EXISTS bottles_per_case INTEGER,
  ADD COLUMN IF NOT EXISTS price_per_bottle NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS tax NUMERIC(10,2);

-- ==============================================
-- SECTION 2: Set Default Values
-- Run this second
-- ==============================================
UPDATE public.factory_pricing
SET bottles_per_case = 12
WHERE bottles_per_case IS NULL;

UPDATE public.factory_pricing
SET price_per_bottle = price_per_case / NULLIF(bottles_per_case, 0)
WHERE price_per_bottle IS NULL 
  AND price_per_case IS NOT NULL
  AND price_per_case > 0
  AND bottles_per_case > 0;

UPDATE public.factory_pricing
SET price_per_bottle = 0
WHERE price_per_bottle IS NULL;

-- ==============================================
-- SECTION 3: Add Constraints
-- Run this third
-- ==============================================
ALTER TABLE public.factory_pricing
  ALTER COLUMN bottles_per_case SET DEFAULT 12,
  ALTER COLUMN bottles_per_case SET NOT NULL;

ALTER TABLE public.factory_pricing
  ALTER COLUMN price_per_bottle SET NOT NULL;

-- ==============================================
-- SECTION 4: Add Generated Column
-- Run this fourth
-- ==============================================
ALTER TABLE public.factory_pricing
  DROP COLUMN IF EXISTS cost_per_case;

ALTER TABLE public.factory_pricing
  ADD COLUMN cost_per_case NUMERIC(10,2) 
  GENERATED ALWAYS AS (price_per_bottle * bottles_per_case) STORED;

-- ==============================================
-- SECTION 5: Fix RLS Policy
-- Run this fifth
-- ==============================================
DROP POLICY IF EXISTS "Allow all operations on factory_pricing" ON public.factory_pricing;

CREATE POLICY "Allow all operations on factory_pricing" 
ON public.factory_pricing 
FOR ALL 
USING (true)
WITH CHECK (true);

-- ==============================================
-- SECTION 6: Verification Queries
-- Run these to verify everything works
-- ==============================================

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'factory_pricing'
ORDER BY ordinal_position;

-- Test the application query
SELECT 
    sku, 
    bottles_per_case,
    price_per_bottle,
    cost_per_case
FROM public.factory_pricing
ORDER BY sku ASC
LIMIT 10;

