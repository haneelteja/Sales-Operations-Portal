-- ==============================================
-- ADD SKU AND NO_OF_CASES COLUMNS TO TRANSPORT_EXPENSES
-- This script adds sku and no_of_cases columns to the transport_expenses table
-- ==============================================

-- Add sku column (nullable, as existing records won't have this)
ALTER TABLE public.transport_expenses
ADD COLUMN IF NOT EXISTS sku TEXT;

-- Add no_of_cases column (nullable, as existing records won't have this)
ALTER TABLE public.transport_expenses
ADD COLUMN IF NOT EXISTS no_of_cases INTEGER;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'transport_expenses'
  AND column_name IN ('sku', 'no_of_cases');

