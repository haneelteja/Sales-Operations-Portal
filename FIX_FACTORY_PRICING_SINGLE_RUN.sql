-- ==============================================
-- FIX FACTORY_PRICING TABLE - SINGLE RUN VERSION
-- Run this entire script at once
-- ==============================================

-- Add missing columns
ALTER TABLE public.factory_pricing
  ADD COLUMN IF NOT EXISTS bottles_per_case INTEGER,
  ADD COLUMN IF NOT EXISTS price_per_bottle NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS tax NUMERIC(10,2);

-- Set default values
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

-- Add constraints
ALTER TABLE public.factory_pricing
  ALTER COLUMN bottles_per_case SET DEFAULT 12,
  ALTER COLUMN bottles_per_case SET NOT NULL;

ALTER TABLE public.factory_pricing
  ALTER COLUMN price_per_bottle SET NOT NULL;

-- Add generated column
ALTER TABLE public.factory_pricing
  DROP COLUMN IF EXISTS cost_per_case;

ALTER TABLE public.factory_pricing
  ADD COLUMN cost_per_case NUMERIC(10,2) 
  GENERATED ALWAYS AS (price_per_bottle * bottles_per_case) STORED;

-- Fix RLS Policy
DROP POLICY IF EXISTS "Allow all operations on factory_pricing" ON public.factory_pricing;

CREATE POLICY "Allow all operations on factory_pricing" 
ON public.factory_pricing 
FOR ALL 
USING (true)
WITH CHECK (true);

