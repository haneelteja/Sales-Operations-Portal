-- Add description column to factory_pricing table
ALTER TABLE factory_pricing
  ADD COLUMN IF NOT EXISTS description text;
